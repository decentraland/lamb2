import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, Item, ItemResponse, PaginatedResponse } from '../../types'
import { compareByRarity } from '../../logic/utils'

function createFilters(url: URL): (item: ItemResponse) => boolean {
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

function createSorting(url: URL): (item1: ItemResponse, item2: ItemResponse) => number {
  const sorting = url.searchParams.has('sort') ? url.searchParams.get('sort') : undefined
  if (sorting === 'name_a_z') {
    return (item1, item2) => item1.name.localeCompare(item2.name)
  }
  if (sorting === 'name_z_a') {
    return (item1, item2) => item2.name.localeCompare(item1.name)
  }
  if (sorting === 'rarest') {
    return compareByRarity
  }
  if (sorting === 'less_rare') {
    return (item1, item2) => compareByRarity(item2, item1)
  }
  if (sorting === 'newest') {
    // TODO think what to do here... which is the newest wearable?
    return (item1, item2) => item2.name.localeCompare(item1.name)
  }
  if (sorting === 'oldest') {
    // TODO think what to do here... which is the oldest wearable?
    return (item1, item2) => compareByRarity(item2, item1)
  }

  // Existing behavior (when no particular sorting required) is to sort by rarity
  return compareByRarity
}

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

    if (includeDefinitions) {
      const wearables = page.elements
      const definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(
        wearables.map((wearable) => wearable.urn)
      )
      const results: ItemResponse[] = []
      for (let i = 0; i < wearables.length; ++i) {
        results.push({
          ...wearables[i],
          definition: includeDefinitions ? definitions[i] : undefined
        })
      }
      page.elements = results
    }

    return {
      status: 200,
      body: {
        ...page
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
