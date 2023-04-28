import { WearableDefinition } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { AppComponents, ThirdParty, ThirdPartyAsset, ThirdPartyAssets, ThirdPartyWearable } from '../../types'
import { addDefinitions } from '../add-definitions'

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

async function fetchAssets(
  components: Pick<AppComponents, 'theGraph' | 'thirdPartyProvidersFetcher' | 'fetch' | 'logs'>,
  owner: string,
  thirdParty: ThirdParty
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

function groupThirdPartyWearablesByURN(
  assets: (ThirdPartyAsset & { definition?: WearableDefinition })[]
): (ThirdPartyWearable & { definition: WearableDefinition })[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable & { definition: WearableDefinition }>()

  for (const asset of assets) {
    if (asset.definition) {
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
          name: asset.definition.name,
          category: asset.definition.data.category,
          definition: asset.definition
        })
      }
    }
  }

  return Array.from(wearablesByURN.values())
}

export async function fetchAllThirdPartyWearables(
  components: Pick<
    AppComponents,
    'theGraph' | 'thirdPartyProvidersFetcher' | 'fetch' | 'logs' | 'wearableDefinitionsFetcher'
  >,
  owner: string
): Promise<(ThirdPartyWearable & { definition: WearableDefinition })[]> {
  const thirdParties = await components.thirdPartyProvidersFetcher.getAll()

  // TODO: test if stateValue is kept in case of an exception
  const thirdPartyAssets = (
    await Promise.all(thirdParties.map((thirdParty: ThirdParty) => fetchAssets(components, owner, thirdParty)))
  ).flat()

  const thirdPartyAssetsWithDefinitions = await addDefinitions<ThirdPartyAsset, WearableDefinition>(
    thirdPartyAssets,
    (asset) => asset.urn.decentraland,
    components.wearableDefinitionsFetcher
  )

  return groupThirdPartyWearablesByURN(thirdPartyAssetsWithDefinitions)
}

export class ThirdPartyNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export async function fetchThirdPartyWearablesFromThirdPartyName(
  components: Pick<AppComponents, 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersFetcher' | 'fetch' | 'theGraph'>,
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

  const thirdParty = await components.thirdPartyProvidersFetcher.get(thirdPartyNameUrn)

  if (!thirdParty) {
    // NOTE: currently lambdas return an empty array with status code 200 for this case
    throw new ThirdPartyNotFoundError(`Third Party not found ${thirdPartyNameUrn.thirdPartyName}`)
  }

  return results
}
