import { WearableCategory, WearableDefinition } from '@dcl/schemas'
import { ElementsFetcher, FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import {
  BaseWearable,
  ErrorResponse,
  HandlerContextWithPath,
  Item,
  PaginatedResponse,
  ThirdPartyWearable,
  WearableType
} from '../../types'
import { createFilters } from './items-commons'

export type MixedWearables = (BaseWearable | Item | ThirdPartyWearable) & { type: WearableType }

type ItemResponse = (BaseWearable | Omit<Item, 'minTransferredAt' | 'maxTransferredAt'> | ThirdPartyWearable) & {
  type: WearableType
  definition: WearableDefinition | undefined
}

const mapItemToItemResponse = (item: MixedWearables, definitions: WearableDefinition | undefined): ItemResponse => ({
  type: item.type,
  urn: item.urn,
  amount: item.individualData.length,
  individualData: item.individualData,
  name: item.name,
  category: item.category,
  rarity: 'rarity' in item ? item.rarity : undefined,
  definition: definitions
})

function createCombinedFetcher(
  baseWearablesFetcher: ElementsFetcher<BaseWearable>,
  wearablesFetcher: ElementsFetcher<Item>,
  thirdPartyWearablesFetcher: ElementsFetcher<ThirdPartyWearable>
): (address: string) => Promise<MixedWearables[]> {
  return async function (address: string): Promise<MixedWearables[]> {
    const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
      baseWearablesFetcher.fetchOwnedElements(address).then((elements: BaseWearable[]) =>
        elements.map((wearable: BaseWearable): BaseWearable & { type: WearableType } => ({
          type: 'base-wearable',
          ...wearable
        }))
      ),
      wearablesFetcher
        .fetchOwnedElements(address)
        .then((elements: Item[]) =>
          elements.map((wearable: Item): Item & { type: WearableType } => ({ type: 'on-chain', ...wearable }))
        ),
      thirdPartyWearablesFetcher.fetchOwnedElements(address).then((elements: ThirdPartyWearable[]) => {
        console.log({ elements })
        return elements.map((wearable: ThirdPartyWearable): ThirdPartyWearable & { type: WearableType } => {
          return {
            type: 'third-party',
            ...wearable
          }
        })
      })
    ])

    return [...baseItems, ...nftItems, ...thirdPartyItems]
  }
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'logs'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher',
    '/explorer-service/backpack/:address/wearables'
  >
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const {
    logs,
    baseWearablesFetcher,
    wearablesFetcher,
    thirdPartyProvidersFetcher,
    thirdPartyWearablesFetcher,
    wearableDefinitionsFetcher
  } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)

  try {
    // const { baseFilter,  onChainFilter, thirdPartyFilter } = createFilters(context.params)
    // sortSpecific = createSort(context.params)
    // const onChainWearables = onChainFilter(wearablesFetcher.fetchOwnedElements(address), onChainFilter)
    // const baseWearables = baseFilter(baseWearablesFetcher.fetchOwnedElements(address), baseFilters)
    // const thirdPartyWearables = thirdPartyFilter(thirdPartyFetcher.fetchOwnedElements(address), thirdPartyFiltrs)

    const fetchCombinedElements = createCombinedFetcher(
      baseWearablesFetcher,
      wearablesFetcher,
      thirdPartyWearablesFetcher
    )
    const page = await fetchAndPaginate<MixedWearables>(address, fetchCombinedElements, pagination, filter, undefined)

    const definitions: (WearableDefinition | undefined)[] = await wearableDefinitionsFetcher.fetchItemsDefinitions(
      page.elements.map((wearable) => wearable.urn)
    )

    const results: ItemResponse[] = []
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
