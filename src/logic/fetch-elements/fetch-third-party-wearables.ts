import { ContractNetwork, createMappingsHelper, Entity, Wearable } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, ThirdPartyProvider, ThirdPartyAsset, ThirdPartyWearable } from '../../types'

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

async function fetchAssets(
  { logs, fetch, metrics }: Pick<AppComponents, 'fetch' | 'logs' | 'metrics'>,
  owner: string,
  thirdParty: ThirdPartyProvider
) {
  const logger = logs.getLogger('fetch-assets')
  const urn = await parseUrn(thirdParty.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse third party id: ${thirdParty.id}`)
  }

  const baseUrl = new URL(thirdParty.resolver).href.replace(/\/$/, '')
  let url: string | undefined = `${baseUrl}/registry/${urn.thirdPartyName}/address/${owner}/assets`

  const allAssets: ThirdPartyAsset[] = []
  do {
    const timer = metrics.startTimer('tpw_provider_fetch_assets_duration_seconds', { id: thirdParty.id })
    let assetsByOwner: ThirdPartyAssets
    try {
      const response = await fetch.fetch(url, { timeout: 5000 })
      assetsByOwner = await response.json()
    } catch (err: any) {
      logger.warn(`Error fetching assets with owner: ${owner}, url: ${url}, error: ${err.message}`)
      break
    } finally {
      timer.end({ id: thirdParty.id })
    }

    if (!assetsByOwner) {
      logger.error(`No assets found with owner: ${owner}, url: ${url}`)
      break
    }

    for (const asset of assetsByOwner.assets ?? []) {
      allAssets.push(asset)
    }

    url = assetsByOwner.next
  } while (url)

  return allAssets
}

async function fetchAssetsV2(
  { contentServerUrl, fetch }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs' | 'metrics'>,
  linkedWearableProvider: ThirdPartyProvider
): Promise<Entity[]> {
  const urn = await parseUrn(linkedWearableProvider.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse linked wearable provider id: ${linkedWearableProvider.id}`)
  }

  const response = await fetch.fetch(`${contentServerUrl}/entities/active/collections/${linkedWearableProvider.id}`)
  const assetsByOwner: LinkedWearableAssetEntities = await response.json()
  return assetsByOwner.entities || []
}

function groupThirdPartyWearablesByURN(assets: (ThirdPartyAsset & { entity: Entity })[]): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const asset of assets) {
    const metadata: Wearable = asset.entity.metadata
    if (wearablesByURN.has(asset.urn.decentraland)) {
      const wearableFromMap = wearablesByURN.get(asset.urn.decentraland)!
      wearableFromMap.individualData.push({ id: asset.urn.decentraland })
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      wearablesByURN.set(asset.urn.decentraland, {
        urn: asset.urn.decentraland,
        individualData: [
          {
            id: asset.urn.decentraland
          }
        ],
        amount: 1,
        name: metadata.name,
        category: metadata.data.category,
        entity: asset.entity
      })
    }
  }

  return Array.from(wearablesByURN.values())
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
        id: indi
      })),
      amount: data.individualData.length,
      name: data.entity.metadata.name,
      category: data.entity.metadata.data.category,
      entity: data.entity
    })
  }
  return Array.from(wearablesByURN.values())
}

export async function fetchUserThirdPartyAssets(
  components: Pick<AppComponents, 'thirdPartyProvidersStorage' | 'contentServerUrl' | 'fetch' | 'logs' | 'metrics'>,
  owner: string,
  collectionId: string
): Promise<ThirdPartyAsset[]> {
  const parts = collectionId.split(':')

  // TODO: [TPW] Use urn parser here
  if (!(parts.length === 5 || parts.length === 6)) {
    throw new Error(`Couldn't parse collectionId ${collectionId}, valid ones are like:
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}`)
  }

  const thirdPartyId = parts.slice(0, 5).join(':')

  let thirdPartyProvider: ThirdPartyProvider | undefined = undefined

  const thirdPartyProviders = await components.thirdPartyProvidersStorage.getAll()
  for (const provider of thirdPartyProviders) {
    if (provider.id === thirdPartyId) {
      thirdPartyProvider = provider
      break
    }
  }

  if (!thirdPartyProvider) {
    return []
  }

  const assetsByOwner = await fetchAssets(components, owner, thirdPartyProvider)
  if (!assetsByOwner) {
    throw new Error(`Could not fetch assets for owner: ${owner}`)
  }

  return assetsByOwner.filter((asset) => asset.urn.decentraland.startsWith(thirdPartyId)) ?? []
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
  >,
  owner: string
): Promise<ThirdPartyWearable[]> {
  async function fetchThirdPartyV1(thirdParties: ThirdPartyProvider[]) {
    console.log('fetchThirdPartyV1', 'thirdParties', thirdParties)

    // TODO: test if stateValue is kept in case of an exception
    const thirdPartyAssets = (
      await Promise.all(
        thirdParties.map((thirdParty: ThirdPartyProvider) => fetchAssets(components, owner, thirdParty))
      )
    ).flat()

    const entities = await components.entitiesFetcher.fetchEntities(thirdPartyAssets.map((tpa) => tpa.urn.decentraland))
    const results: (ThirdPartyAsset & { entity: Entity })[] = []
    for (let i = 0; i < thirdPartyAssets.length; ++i) {
      const entity = entities[i]
      if (entity) {
        results.push({
          ...thirdPartyAssets[i],
          entity
        })
      }
    }

    return groupThirdPartyWearablesByURN(results)
  }

  async function fetchThirdPartyV2(linkedWearableProviders: ThirdPartyProvider[]) {
    console.log('fetchThirdPartyV2', 'linkedWearableProviders', linkedWearableProviders)

    const contractAddresses = linkedWearableProviders.reduce(
      (carry, provider) => {
        ;(provider.metadata.thirdParty.contracts || []).forEach((contract) => {
          carry[contract.network] = carry[contract.network] || new Set<string>()
          carry[contract.network].add(contract.address)
        })
        return carry
      },
      {} as Record<string, Set<string>>
    )
    console.log('contractAddresses', contractAddresses)

    const nfts = await components.alchemyNftFetcher.getNFTsForOwner(owner, contractAddresses)
    console.log('nfts', nfts)

    const providersThatReturnedNfts = new Set<string>()
    for (const nft of nfts) {
      const nftParts = nft.split(':')
      // TODO Performance could be improved here by having indexed the providers by their network and contract addresses
      const provider = linkedWearableProviders.find((provider) =>
        (provider.metadata.thirdParty.contracts || []).find(
          (contract) => contract.network === nftParts[0] && contract.address === nftParts[1]
        )
      )
      if (provider) {
        providersThatReturnedNfts.add(`${provider.id}`)
      }
    }
    console.log('providersThatReturnedNfts', providersThatReturnedNfts)

    const providersToCheck = linkedWearableProviders.filter((provider) => providersThatReturnedNfts.has(provider.id))
    console.log('providersToCheck', providersToCheck)

    const linkedWearableEntities = (
      await Promise.all(providersToCheck.map((provider: ThirdPartyProvider) => fetchAssetsV2(components, provider)))
    ).flat()
    console.log('linkedWearableEntities', linkedWearableEntities)

    const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}
    for (const entity of linkedWearableEntities) {
      const urn = entity.metadata.id
      if (!entity.metadata.mappings) {
        console.log("discarding entity because it doesn't have any mappings", urn)
        continue
      }

      const mappingsHelper = createMappingsHelper(entity.metadata.mappings)
      for (const nft of nfts) {
        const [network, contract, tokenId] = nft.split(':')
        if (mappingsHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
          if (assignedLinkedWearables[urn]) {
            assignedLinkedWearables[urn].individualData.push(tokenId)
          } else {
            assignedLinkedWearables[urn] = { individualData: [tokenId], entity }
          }
        }
      }
    }
    console.log('assignedLinkedWearables', assignedLinkedWearables)

    const grouped = groupLinkedWearablesByURN(assignedLinkedWearables)
    console.log('grouped', grouped)

    return grouped
  }

  const thirdParties = await components.thirdPartyProvidersStorage.getAll()

  const [providersV1, providersV2] = thirdParties.reduce(
    (acc, provider) => {
      if ((provider.metadata.thirdParty.contracts?.length || 0) <= 0) {
        acc[0].push(provider)
      } else {
        acc[1].push(provider)
      }
      return acc
    },
    [[], []] as ThirdPartyProvider[][]
  )

  const [thirdPartyV1, thirdPartyV2] = await Promise.all([
    fetchThirdPartyV1(providersV1),
    fetchThirdPartyV2(providersV2)
  ])

  return [...thirdPartyV1, ...thirdPartyV2]
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
