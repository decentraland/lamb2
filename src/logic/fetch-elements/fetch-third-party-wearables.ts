import { ContractNetwork, createMappingsHelper, Entity } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, ThirdPartyAsset, ThirdPartyProvider, ThirdPartyWearable } from '../../types'
import { LinkedWearableEntityReference } from '../../ports/ownership-caches'

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

export type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

type LinkedWearableAssetEntities = {
  total: number
  entities: Entity[]
}

async function fetchAllEntitiesWithPagination(
  { contentServerUrl, fetch, logs }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs'>,
  collectionId: string
): Promise<{ entities: Entity[]; isComplete: boolean }> {
  const logger = logs.getLogger('fetch-third-party-wearables')
  const pageSize = 1000 // Maximum allowed by content server

  logger.info('Fetching entities for collection with parallel pagination', {
    collectionId,
    pageSize
  })

  try {
    // 1. Fetch first page to get total count
    const firstPageUrl = `${contentServerUrl}/entities/active/collections/${collectionId}?pageSize=${pageSize}&pageNum=1`
    logger.debug('Fetching first page to determine total entities', { url: firstPageUrl })

    const firstResponse = await fetch.fetch(firstPageUrl)
    if (!firstResponse.ok) {
      throw new Error(`Failed to fetch first page for collection ${collectionId}: ${firstResponse.status}`)
    }

    const firstPageData: LinkedWearableAssetEntities = await firstResponse.json()

    // Handle empty collection
    if (!firstPageData.entities || firstPageData.entities.length === 0) {
      logger.info('Collection is empty', { collectionId })
      return { entities: [], isComplete: true }
    }

    const totalEntities = firstPageData.total || firstPageData.entities.length
    const totalPages = Math.ceil(totalEntities / pageSize)

    logger.info('Starting parallel pagination', {
      collectionId,
      totalEntities,
      totalPages,
      strategy: totalPages > 1 ? 'parallel' : 'single-page'
    })

    // If only one page, return immediately
    if (totalPages <= 1) {
      logger.debug('Single page collection - no parallel fetching needed')
      return {
        entities: firstPageData.entities,
        isComplete: true
      }
    }

    // 2. Fetch remaining pages in parallel
    const remainingPageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2) // [2, 3, 4, ...]

    logger.debug('Fetching remaining pages in parallel', {
      remainingPages: remainingPageNumbers.length,
      pageNumbers: remainingPageNumbers.slice(0, 5).join(', ')
    })

    const parallelFetches = remainingPageNumbers.map(async (pageNum) => {
      const url = `${contentServerUrl}/entities/active/collections/${collectionId}?pageSize=${pageSize}&pageNum=${pageNum}`

      try {
        const response = await fetch.fetch(url)
        if (!response.ok) {
          logger.warn(`Failed to fetch page ${pageNum}`, {
            status: response.status,
            collectionId
          })
          return null
        }

        const data: LinkedWearableAssetEntities = await response.json()
        return { pageNum, entities: data.entities || [] }
      } catch (error) {
        logger.warn(`Error fetching page ${pageNum}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          collectionId
        })
        return null
      }
    })

    // 3. Wait for all parallel fetches to complete
    const results = await Promise.all(parallelFetches)

    // 4. Combine all entities
    const allEntities = [...firstPageData.entities]
    let failedPages = 0

    for (const result of results) {
      if (result === null) {
        failedPages++
      } else {
        allEntities.push(...result.entities)
      }
    }

    const isComplete = failedPages === 0

    logger.info('Parallel pagination completed', {
      collectionId,
      totalEntities: allEntities.length,
      totalPages,
      failedPages,
      isComplete: String(isComplete),
      entitiesWithMappings: allEntities.filter((e) => e.metadata.mappings).length,
      performanceGain: `${totalPages}x faster than sequential`
    })

    return { entities: allEntities, isComplete }
  } catch (error) {
    logger.error('Parallel pagination failed for collection', {
      collectionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

function filterMinimalDataByUserNfts(minimalData: LinkedWearableEntityReference[], userOwnedNfts: string[]): string[] {
  const matchingUrns: string[] = []

  for (const item of minimalData) {
    const entityMappingHelper = createMappingsHelper(item.mappings)

    for (const nft of userOwnedNfts) {
      const [network, contract, tokenId] = nft.split(':')
      if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
        matchingUrns.push(item.entityUrn)
        break // Found match, no need to check more NFTs for this entity
      }
    }
  }

  return matchingUrns
}

function filterEntitiesByUserNfts(entities: Entity[], userOwnedNfts: string[]): Entity[] {
  const matchingEntities: Entity[] = []

  for (const entity of entities) {
    if (!entity.metadata.mappings) {
      continue
    }

    const entityMappingHelper = createMappingsHelper(entity.metadata.mappings)

    for (const nft of userOwnedNfts) {
      const [network, contract, tokenId] = nft.split(':')
      if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
        matchingEntities.push(entity)
        break // Found match, no need to check more NFTs for this entity
      }
    }
  }

  return matchingEntities
}

async function fetchEntitiesByUrns(
  { contentServerUrl, fetch, logs }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs'>,
  entityUrns: string[]
): Promise<Entity[]> {
  if (entityUrns.length === 0) {
    return []
  }

  const logger = logs.getLogger('fetch-third-party-wearables')

  try {
    logger.debug('Bulk fetching entities by URNs', {
      entityCount: entityUrns.length,
      sampleUrns: entityUrns.slice(0, 3).join(', ')
    })

    const response = await fetch.fetch(`${contentServerUrl}/entities/active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pointers: entityUrns })
    })

    if (!response.ok) {
      logger.error('Failed to bulk fetch entities', {
        status: response.status,
        statusText: response.statusText,
        entityCount: entityUrns.length
      })
      return [] // Graceful degradation
    }

    const entities: Entity[] = await response.json()

    logger.debug('Bulk fetch completed', {
      requested: entityUrns.length,
      received: entities.length
    })

    return entities
  } catch (error) {
    logger.error('Bulk fetch failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entityCount: entityUrns.length
    })
    return [] // Graceful degradation
  }
}

async function fetchAssetsRepresentation(
  components: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs' | 'ownershipCaches'>,
  thirdPartyProvider: ThirdPartyProvider,
  userOwnedNfts: string[]
): Promise<Entity[]> {
  const logger = components.logs.getLogger('fetch-third-party-wearables')
  const collectionId = thirdPartyProvider.id

  const urn = await parseUrn(collectionId)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse linked wearable provider id: ${collectionId}`)
  }

  // 1. Check cache first
  const cachedData = components.ownershipCaches.tpwEntitiesCache.get(collectionId)

  if (cachedData) {
    logger.info('Cache hit for collection', {
      collectionId,
      collectionName: thirdPartyProvider.metadata.thirdParty.name,
      cachedEntities: cachedData.length
    })

    // Filter minimal data by user's NFTs and bulk fetch only matches
    const matchingUrns = filterMinimalDataByUserNfts(cachedData, userOwnedNfts)

    logger.debug('Filtered entities by user NFTs', {
      collectionId,
      totalCached: cachedData.length,
      userMatches: matchingUrns.length
    })

    return await fetchEntitiesByUrns(components, matchingUrns)
  }

  // 2. Cache MISS - fetch all entities with pagination
  logger.info('Cache miss for collection - fetching with pagination', {
    collectionId,
    collectionName: thirdPartyProvider.metadata.thirdParty.name
  })

  const { entities: allEntities, isComplete } = await fetchAllEntitiesWithPagination(components, collectionId)

  // 3. Filter entities with mappings and extract minimal data for cache
  const entitiesWithMappings = allEntities.filter((entity) => entity.metadata.mappings)
  const minimalDataForCache: LinkedWearableEntityReference[] = entitiesWithMappings.map((entity) => ({
    entityUrn: entity.metadata.id,
    mappings: entity.metadata.mappings
  }))

  // 4. Store in cache (even if empty or incomplete)
  components.ownershipCaches.tpwEntitiesCache.set(collectionId, minimalDataForCache)

  logger.info('Collection cached successfully', {
    collectionId,
    collectionName: thirdPartyProvider.metadata.thirdParty.name,
    totalEntitiesFetched: allEntities.length,
    entitiesWithMappings: entitiesWithMappings.length,
    isComplete: String(isComplete),
    cacheSize: minimalDataForCache.length
  })

  // 5. Filter and return only entities matching user's NFTs
  return filterEntitiesByUserNfts(entitiesWithMappings, userOwnedNfts)
}

function groupLinkedWearablesByURN(
  assets: Record<
    string,
    {
      individualData: string[]
      entity: Entity
    }
  >
): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const [assetId, data] of Object.entries(assets)) {
    wearablesByURN.set(assetId, {
      urn: assetId,
      individualData: data.individualData.map((indi) => ({
        id: `${assetId}:${indi}`,
        tokenId: indi
      })),
      amount: data.individualData.length,
      name: data.entity.metadata.name,
      category: data.entity.metadata.data.category,
      entity: data.entity
    })
  }
  return Array.from(wearablesByURN.values())
}

export async function fetchAllThirdPartyWearables(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'logs'
    | 'entitiesFetcher'
    | 'metrics'
    | 'ownershipCaches'
  >,
  owner: string
): Promise<ThirdPartyWearable[]> {
  const thirdParties = await components.thirdPartyProvidersStorage.getAll()

  return await _fetchThirdPartyWearables(components, owner, thirdParties)
}

async function _fetchThirdPartyWearables(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'logs'
    | 'entitiesFetcher'
    | 'metrics'
    | 'ownershipCaches'
  >,
  owner: string,
  thirdParties: ThirdPartyProvider[]
): Promise<ThirdPartyWearable[]> {
  async function fetchThirdPartyWearables(thirdPartyProviders: ThirdPartyProvider[]) {
    if (thirdPartyProviders.length === 0) {
      return []
    }

    const thirdPartyContractsByNetwork = thirdPartyProviders.reduce(
      (carry, provider) => {
        ;(provider.metadata.thirdParty.contracts || []).forEach((contract) => {
          carry[contract.network] = carry[contract.network] || new Set<string>()
          carry[contract.network].add(contract.address)
        })
        return carry
      },
      {} as Record<string, Set<string>>
    )

    const ownedNftUrns = await components.alchemyNftFetcher.getNFTsForOwner(owner, thirdPartyContractsByNetwork)
    const providersThatReturnedNfts = new Set<string>()
    for (const urn of ownedNftUrns) {
      const [network, contractAddress] = urn.split(':')
      const providers = thirdPartyProviders.filter((provider) =>
        (provider.metadata.thirdParty.contracts || []).find(
          (contract) => contract.network === network && contract.address === contractAddress
        )
      )
      if (providers.length > 0) {
        for (const provider of providers) {
          providersThatReturnedNfts.add(`${provider.id}`)
        }
      }
    }

    const providersToCheck = thirdPartyProviders.filter((provider) => providersThatReturnedNfts.has(provider.id))

    const thirdPartyEntities = (
      await Promise.all(
        providersToCheck.map((provider: ThirdPartyProvider) =>
          fetchAssetsRepresentation(components, provider, ownedNftUrns)
        )
      )
    ).flat()

    const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}

    // All entities are pre-filtered to match user's NFTs, now build individual NFT assignments
    for (const entity of thirdPartyEntities) {
      const urn = entity.metadata.id
      const entityMappingHelper = createMappingsHelper(entity.metadata.mappings)

      for (const nft of ownedNftUrns) {
        const [network, contract, tokenId] = nft.split(':')
        if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
          if (assignedLinkedWearables[urn]) {
            assignedLinkedWearables[urn].individualData.push(nft)
          } else {
            assignedLinkedWearables[urn] = { individualData: [nft], entity }
          }
        }
      }
    }

    return groupLinkedWearablesByURN(assignedLinkedWearables)
  }

  const providers = thirdParties.filter((provider) => (provider.metadata.thirdParty.contracts?.length ?? 0) > 0)

  const thirdPartyWearables = await fetchThirdPartyWearables(providers)

  const thirdPartyWearablesByUrn = thirdPartyWearables.reduce(
    (acc, tpw) => {
      // If there are repeated wearables, we should merge them
      acc[tpw.urn] = tpw
      return acc
    },
    {} as Record<string, ThirdPartyWearable>
  )
  return Object.values(thirdPartyWearablesByUrn)
}

export async function fetchThirdPartyWearablesFromThirdPartyName(
  components: Pick<AppComponents, 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersStorage' | 'fetch'>,
  address: string,
  thirdPartyNameUrn: BlockchainCollectionThirdPartyName
): Promise<ThirdPartyWearable[]> {
  const results: ThirdPartyWearable[] = []

  const allWearables = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)

  if (allWearables) {
    for (const wearable of allWearables) {
      const wearableUrn = await parseUrn(wearable.urn)
      if (
        wearableUrn &&
        wearableUrn.type === URN_THIRD_PARTY_ASSET_TYPE &&
        wearableUrn.thirdPartyName === thirdPartyNameUrn.thirdPartyName
      ) {
        results.push(wearable)
      }
    }
  }

  const thirdParty = await components.thirdPartyProvidersStorage.get(thirdPartyNameUrn)

  if (!thirdParty) {
    // NOTE: currently lambdas return an empty array with status code 200 for this case
    throw new FetcherError(`Third Party not found: ${thirdPartyNameUrn.thirdPartyName}`)
  }

  return results
}
