import { WearableDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { parseUrn } from '../../logic/utils'
import {
  AppComponents,
  BaseWearable,
  ErrorResponse,
  HandlerContextWithPath,
  OnChainWearable,
  PaginatedResponse,
  ThirdPartyWearable,
  WearableType
} from '../../types'
import { createFilters } from './items-commons'

type MixedWearable = Omit<BaseWearable | OnChainWearable | ThirdPartyWearable, 'individualData'> & {
  individualData: OnChainWearable['individualData'] | ThirdPartyWearable['individualData']
  type: WearableType
}

export type MixedWearableResponse = MixedWearable & {
  definition?: WearableDefinition
} & Partial<Pick<OnChainWearable, 'rarity'>>

export type MixedWearables = (BaseWearable | OnChainWearable | ThirdPartyWearable) & { type: WearableType }

function hasRarity(wearable: MixedWearables): wearable is MixedWearables & { rarity: string } {
  return 'rarity' in wearable
}

const mapItemToItemResponse = (
  item: MixedWearable,
  definitions: WearableDefinition | undefined
): MixedWearableResponse => ({
  type: item.type,
  urn: item.urn,
  amount: item.individualData.length,
  individualData: item.individualData,
  name: item.name,
  category: item.category,
  rarity: hasRarity(item) ? item.rarity : undefined,
  definition: definitions
})

function createCombinedFetcher(
  components: Pick<
    AppComponents,
    | 'logs'
    | 'fetch'
    | 'theGraph'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher'
  >,
  collectionTypes: string[],
  thirdPartyCollectionId: string[]
): (address: string) => Promise<MixedWearables[]> {
  return async function (address: string): Promise<MixedWearables[]> {
    const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
      collectionTypes.includes('base-wearable')
        ? components.baseWearablesFetcher.fetchOwnedElements(address).then((elements: BaseWearable[]) =>
            elements.map((wearable: BaseWearable): BaseWearable & { type: WearableType } => ({
              type: 'base-wearable',
              ...wearable
            }))
          )
        : [],
      collectionTypes.includes('on-chain')
        ? components.wearablesFetcher.fetchOwnedElements(address).then((elements: OnChainWearable[]) =>
            elements.map((wearable: OnChainWearable): OnChainWearable & { type: WearableType } => ({
              type: 'on-chain',
              ...wearable
            }))
          )
        : [],
      collectionTypes.includes('third-party')
        ? thirdPartyCollectionId.length === 0
          ? components.thirdPartyWearablesFetcher.fetchOwnedElements(address).then((elements: ThirdPartyWearable[]) =>
              elements.map((wearable: ThirdPartyWearable): ThirdPartyWearable & { type: WearableType } => {
                return {
                  type: 'third-party',
                  ...wearable
                }
              })
            )
          : Promise.all(
              thirdPartyCollectionId.map(async (thirdPartyCollectionId) => {
                // Strip the last part (the 6th part) if a collection contract id is specified
                const collectionIdCleaned = thirdPartyCollectionId.split(':').slice(0, 5).join(':')
                const urn = await parseUrn(collectionIdCleaned)
                if (!urn || urn.type !== 'blockchain-collection-third-party-name') {
                  return []
                }

                return (await fetchThirdPartyWearablesFromThirdPartyName(components, address, urn)).map(
                  (wearable: ThirdPartyWearable): ThirdPartyWearable & { type: WearableType } => {
                    return {
                      type: 'third-party',
                      ...wearable
                    }
                  }
                )
              })
            ).then((elements: (ThirdPartyWearable & { type: WearableType })[][]) => elements.flat(1))
        : []
    ])

    return [...baseItems, ...nftItems, ...thirdPartyItems]
  }
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'logs'
    | 'fetch'
    | 'theGraph'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher',
    '/explorer-service/backpack/:address/wearables'
  >
): Promise<PaginatedResponse<MixedWearableResponse> | ErrorResponse> {
  const { logs, wearableDefinitionsFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : ['base-wearable', 'on-chain', 'third-party']
  const thirdPartyCollectionId = context.url.searchParams.has('thirdPartyCollectionId')
    ? context.url.searchParams.getAll('thirdPartyCollectionId')
    : []

  try {
    const fetchCombinedElements = createCombinedFetcher(context.components, collectionTypes, thirdPartyCollectionId)
    const page = await fetchAndPaginate<MixedWearables>(address, fetchCombinedElements, pagination, filter, undefined)

    const definitions: (WearableDefinition | undefined)[] = await wearableDefinitionsFetcher.fetchItemsDefinitions(
      page.elements.map((wearable) => wearable.urn)
    )

    const results: MixedWearableResponse[] = []
    const wearables = page.elements

    for (let i = 0; i < wearables.length; ++i) {
      results.push(mapItemToItemResponse(wearables[i], definitions[i] || undefined))
    }

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  } catch (err: any) {
    if (err instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch wearables right now'
        }
      }
    }
    logger.error(err)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}
