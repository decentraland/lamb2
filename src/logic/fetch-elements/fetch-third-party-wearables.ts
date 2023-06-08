import { Entity, Wearable } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, ThirdPartyProvider, ThirdPartyAsset, ThirdPartyAssets, ThirdPartyWearable } from '../../types'

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

async function fetchAssets(
  components: Pick<AppComponents, 'fetch' | 'logs'>,
  owner: string,
  thirdParty: ThirdPartyProvider
) {
  const { logs, fetch } = components
  const logger = logs.getLogger('fetch-assets')
  const urn = await parseUrn(thirdParty.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse third party id: ${thirdParty.id}`)
  }

  const baseUrl = new URL(thirdParty.resolver).href.replace(/\/$/, '')
  let url: string | undefined = `${baseUrl}/registry/${urn.thirdPartyName}/address/${owner}/assets`

  const allAssets: ThirdPartyAsset[] = []
  try {
    do {
      const response = await fetch.fetch(url, { timeout: 5000 })
      if (!response.ok) {
        logger.error(`Http status ${response.status} from ${url}`)
        break
      }

      const responseVal = await response.json()
      const assetsByOwner = responseVal as ThirdPartyAssets
      if (!assetsByOwner) {
        logger.error(`No assets found with owner: ${owner}, url: ${url}`)
        break
      }

      for (const asset of assetsByOwner.assets ?? []) {
        allAssets.push(asset)
      }

      url = assetsByOwner.next
    } while (url)
  } catch (err: any) {
    logger.warn(`Error fetching assets with owner: ${owner}, url: ${url}, error: ${err.message}`)
  }

  return allAssets
}

function groupThirdPartyWearablesByURN(assets: (ThirdPartyAsset & { entity: Entity })[]): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const asset of assets) {
    const metadata: Wearable = asset.entity.metadata
    if (wearablesByURN.has(asset.urn.decentraland)) {
      const wearableFromMap = wearablesByURN.get(asset.urn.decentraland)!
      wearableFromMap.individualData.push({ id: asset.id })
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      wearablesByURN.set(asset.urn.decentraland, {
        urn: asset.urn.decentraland,
        individualData: [
          {
            id: asset.id
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

export async function fetchAllThirdPartyWearables(
  components: Pick<AppComponents, 'thirdPartyProvidersStorage' | 'fetch' | 'logs' | 'entitiesFetcher'>,
  owner: string
): Promise<ThirdPartyWearable[]> {
  const thirdParties = await components.thirdPartyProvidersStorage.getAll()

  // TODO: test if stateValue is kept in case of an exception
  const thirdPartyAssets = (
    await Promise.all(thirdParties.map((thirdParty: ThirdPartyProvider) => fetchAssets(components, owner, thirdParty)))
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
