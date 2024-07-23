import { BlockchainCollectionLinkedWearablesProvider, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, LinkedWearable, LinkedWearableProvider, ThirdPartyAsset, ThirdPartyWearable } from '../../types'
import { Entity } from '@dcl/schemas'

type LinkedWearableAssetEntities = {
  total: number
  entities: Entity[]
}

async function fetchAssets(
  { contentServerUrl, logs, fetch, metrics }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs' | 'metrics'>,
  owner: string,
  linkedWearableProvider: LinkedWearableProvider
): Promise<Entity[]> {
  // const logger = logs.getLogger('fetch-assets')
  const urn = await parseUrn(linkedWearableProvider.id)
  if (!urn || urn.type !== 'blockchain-collection-linked-wearables-provider') {
    throw new Error(`Couldn't parse linked wearable provider id: ${linkedWearableProvider.id}`)
  }

  const response = await fetch.fetch(`${contentServerUrl}/entities/active/collections/${linkedWearableProvider.id}`)
  const assetsByOwner: LinkedWearableAssetEntities = await response.json()
  return assetsByOwner.entities || []

  // for (const asset of assetsByOwner.entities ?? []) {
  //   allAssets.push(asset)
  // }

  // const baseUrl = new URL(linkedWearableProvider.resolver).href.replace(/\/$/, '')
  // let url: string | undefined = `${baseUrl}/registry/${urn.linkedWearableProvider}/address/${owner}/assets`

  // const allAssets: LinkedWearableAsset[] = []
  // do {
  //   const timer = metrics.startTimer('tpw_provider_fetch_assets_duration_seconds', { id: linkedWearableProvider.id })
  //   let assetsByOwner: LinkedWearableAssets
  //   try {
  //     const response = await fetch.fetch(url, { timeout: 5000 })
  //     assetsByOwner = await response.json()
  //   } catch (err: any) {
  //     logger.warn(`Error fetching assets with owner: ${owner}, url: ${url}, error: ${err.message}`)
  //     break
  //   } finally {
  //     timer.end({ id: linkedWearableProvider.id })
  //   }
  //
  //   if (!assetsByOwner) {
  //     logger.error(`No assets found with owner: ${owner}, url: ${url}`)
  //     break
  //   }
  //
  //   url = assetsByOwner.next
  // } while (url)

  // return allAssets
}

function groupLinkedWearablesByURN(
  assets: Record<
    string,
    {
      individualData: string[]
      entity: Entity
    }
  >
): LinkedWearable[] {
  const wearablesByURN = new Map<string, LinkedWearable>()

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

export async function fetchUserLinkedWearableAssets(
  components: Pick<AppComponents, 'contentServerUrl' | 'linkedWearableProvidersStorage' | 'fetch' | 'logs' | 'metrics'>,
  owner: string,
  collectionId: string
): Promise<ThirdPartyAsset[]> {
  const parsedUrn = await parseUrn(collectionId)

  if (
    !parsedUrn ||
    !(
      parsedUrn.type === 'blockchain-collection-linked-wearables-provider' ||
      parsedUrn.type === 'blockchain-collection-linked-wearables-collection'
    )
  ) {
    throw new Error(`Couldn't parse collectionId ${collectionId}, valid ones are like:
    \n - decentraland:{network}:collections-linked-wearables:{linkedWearableProvider}
    \n - decentraland:{network}:collections-linked-wearables:{linkedWearableProvider}:{contractAddressChain}:{collectionId(0x[a-fA-F0-9]+)}`)
  }

  let linkedWearableProvider: LinkedWearableProvider | undefined = undefined

  const linkedWearableProviders = await components.linkedWearableProvidersStorage.getAll()
  for (const provider of linkedWearableProviders) {
    if (collectionId.startsWith(provider.id)) {
      linkedWearableProvider = provider
      break
    }
  }

  if (!linkedWearableProvider) {
    return []
  }

  const assetsByOwner = await fetchAssets(components, owner, linkedWearableProvider)
  if (!assetsByOwner) {
    throw new Error(`Could not fetch assets for owner: ${owner}`)
  }

  return []
}

export async function fetchAllLinkedWearables(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'logs'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'entitiesFetcher'
    | 'metrics'
  >,
  owner: string
): Promise<LinkedWearable[]> {
  const linkedWearableProviders = await components.linkedWearableProvidersStorage.getAll()
  console.log('linkedWearableProviders', linkedWearableProviders)

  const allValidPrefixes = linkedWearableProviders
    .map((provider) =>
      provider.metadata.thirdParty.contracts.map((contract) => `${provider.id}:${contract.network}:${contract.address}`)
    )
    .flat()
  console.log('allValidPrefixes', allValidPrefixes)

  const nfts = await components.alchemyNftFetcher.getNFTsForOwner(owner, allValidPrefixes)
  console.log('nfts', nfts)

  const providersThatReturnedNfts = new Set<string>()
  for (const nft of nfts) {
    const nftParts = nft.split(':')
    const provider = linkedWearableProviders.find((provider) =>
      provider.metadata.thirdParty.contracts.find(
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
    await Promise.all(
      providersToCheck.map((provider: LinkedWearableProvider) => fetchAssets(components, owner, provider))
    )
  ).flat()
  console.log('linkedWearableEntities', linkedWearableEntities)

  const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}
  function add(urn: string, tokenId: string, entity: Entity) {
    if (assignedLinkedWearables[urn]) {
      assignedLinkedWearables[urn].individualData.push(tokenId)
    } else {
      assignedLinkedWearables[urn] = { individualData: [tokenId], entity }
    }
  }
  for (const entity of linkedWearableEntities) {
    const urn = entity.metadata.id
    if (!allValidPrefixes.some((prefix) => urn.startsWith(prefix))) {
      console.log('discarding entity because not a valid prefix', urn)
      continue
    }

    const collectionId = entity.metadata.id.split(':').slice(0, -1).join(':')
    console.log('entity metadata id', entity.metadata.id, collectionId)
    const urnParts = entity.metadata.id.split(':')
    const providerUrn = urnParts.slice(0, 5).join(':')
    const mappings = entity.metadata.mappings
    const mapping = mappings[0]
    console.log('providerUrn', providerUrn)
    // TODO cross the mapping info with the tokens retrieved and add the assets as appropriate
    const networkAndContract = urnParts.slice(5, 7).join(':').toLowerCase()
    for (const nft of nfts) {
      if (nft.toLowerCase().startsWith(networkAndContract)) {
        const tokenId = nft.substring(urnParts.slice(5, 7).join(':').length + 1)
        console.log('nft under test', nft, mapping)
        switch (mapping.type) {
          case 'any':
            console.log('any: matched')
            add(urn, `${urn}:${tokenId}`, entity)
            break

          case 'single':
            if (mapping.id === tokenId) {
              console.log('single matched')
              add(urn, `${urn}:${tokenId}`, entity)
            } else {
              console.log('single not matched')
            }
            break

          case 'multiple':
            let matched = 0
            for (const m of mapping.ids) {
              if (m === tokenId) {
                matched++
                console.log(`multiple matched for ${tokenId}`)
                add(urn, `${urn}:${tokenId}`, entity)
              }
              // TODO Do we want to assign many if the user has many tokenIds that match the mapping? Yes
            }
            if (matched === 0) {
              console.log(`multiple not matched for ${tokenId}`)
            }
            break

          case 'range':
            const from = BigInt(mapping.from)
            const to = BigInt(mapping.to)
            const tId = BigInt(tokenId)
            if (tId >= from && tId <= to) {
              // TODO Add the asset to the list
              console.log(`range matched for ${tokenId}`)

              add(urn, `${urn}:${tokenId}`, entity)
            } else {
              console.log(`range not matched for ${tokenId}`)
            }
            break

          default:
            console.log('default', mappings)
            throw new Error(`Invalid mapping type: ${mapping.type}`)
        }
      }
    }
  }
  console.log('assignedLinkedWearables', assignedLinkedWearables)

  const grouped = groupLinkedWearablesByURN(assignedLinkedWearables)
  console.log('grouped', grouped)

  return grouped
}

export async function fetchLinkedWearablesFromProvider(
  components: Pick<AppComponents, 'linkedWearablesFetcher' | 'linkedWearableProvidersStorage' | 'fetch'>,
  address: string,
  linkedWearableProvider: BlockchainCollectionLinkedWearablesProvider
): Promise<ThirdPartyWearable[]> {
  const results: ThirdPartyWearable[] = []

  const allWearables = await components.linkedWearablesFetcher.fetchOwnedElements(address)
  if (allWearables) {
    for (const wearable of allWearables) {
      const wearableUrn = await parseUrn(wearable.urn)
      if (
        wearableUrn &&
        wearableUrn.type === 'blockchain-collection-linked-wearables-asset' &&
        wearableUrn.linkedWearableProvider === linkedWearableProvider.linkedWearableProvider
      ) {
        results.push(wearable)
      }
    }
  }

  const provider = await components.linkedWearableProvidersStorage.get(linkedWearableProvider)

  if (!provider) {
    // NOTE: currently lambdas return an empty array with status code 200 for this case
    throw new FetcherError(`Linked Wearable Provider not found: ${linkedWearableProvider.linkedWearableProvider}`)
  }

  return results
}
