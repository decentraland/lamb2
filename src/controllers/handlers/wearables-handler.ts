import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import {
  ErrorResponse,
  HandlerContextWithPath,
  Item,
  ItemResponse,
  PaginatedResponse,
  WearableDefinition
} from '../../types'
import { compareByRarity } from '../../logic/utils'

function createFilters(url: URL): (item: Item) => boolean {
  const categories = url.searchParams.has('category') ? url.searchParams.getAll('category') : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name') : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity') : undefined

  return (item: Item) => {
    if (categories && categories.length > 0 && !categories.includes(item.category)) {
      return false
    }
    if (name && !item.name.toLowerCase().includes(name.toLowerCase())) {
      return false
    }
    if (rarity && item.rarity !== rarity) {
      return false
    }
    return true
  }
}

function createSorting(url: URL): (item1: Item, item2: Item) => number {
  const sort = url.searchParams.has('sort') ? url.searchParams.get('sort') : undefined
  if (sort === 'name_a_z') {
    return (item1, item2) => item1.name.localeCompare(item2.name)
  }
  if (sort === 'name_z_a') {
    return (item1, item2) => item2.name.localeCompare(item1.name)
  }
  if (sort === 'rarest') {
    return compareByRarity
  }
  if (sort === 'less_rare') {
    return (item1, item2) => compareByRarity(item2, item1)
  }
  if (sort === 'newest') {
    return (item1, item2) => item1.maxTransferredAt - item2.maxTransferredAt
  }
  if (sort === 'oldest') {
    return (item1, item2) => item1.minTransferredAt - item2.minTransferredAt
  }

  // Existing behavior (when no particular sort requested) is to sort by rarity
  return compareByRarity
}

const mapItemToItemResponse = (item: Item, definitions: WearableDefinition | undefined): ItemResponse => ({
  urn: item.urn,
  amount: item.individualData.length,
  individualData: item.individualData,
  name: item.name,
  category: item.category,
  rarity: item.rarity,
  definition: definitions
})

export async function wearablesHandler(
  context: HandlerContextWithPath<
    'logs' | 'wearablesFetcher' | 'wearableDefinitionsFetcher',
    '/users/:address/wearables'
  >
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, wearableDefinitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createSorting(context.url)

  try {
    const page = await fetchAndPaginate<Item>(address, wearablesFetcher.fetchOwnedElements, pagination, filter, sorting)

    const results: ItemResponse[] = []
    const wearables = page.elements
    const definitions: (WearableDefinition | undefined)[] = includeDefinitions
      ? await wearableDefinitionsFetcher.fetchItemsDefinitions(wearables.map((wearable) => wearable.urn))
      : []

    for (let i = 0; i < wearables.length; ++i) {
      results.push(mapItemToItemResponse(wearables[i], includeDefinitions ? definitions[i] : undefined))
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
