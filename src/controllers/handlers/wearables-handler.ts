import { WearableDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse } from '../../types'

// TODO: change this name
type ItemResponse = Item & {
  definition?: WearableDefinition
}

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

  try {
    const page = await fetchAndPaginate<Item>(address, wearablesFetcher.fetchOwnedElements, pagination, filter)

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
