import { FetcherError, FetcherErrorCode } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { Definition, ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse } from '../../types'

// TODO: change this name
type ItemResponse = Item & {
  definition?: Definition
}

export async function wearablesHandler(
  context: HandlerContextWithPath<'logs' | 'wearablesFetcher' | 'definitionsFetcher', '/users/:address/wearables'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const page = await fetchAndPaginate<Item>(address, wearablesFetcher.fetchOwnedElements, pagination)

    if (includeDefinitions) {
      const wearables = page.elements
      const definitions = await definitionsFetcher.fetchWearablesDefinitions(wearables.map((wearable) => wearable.urn))
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
      switch (err.code) {
        case FetcherErrorCode.CANNOT_FETCH_ELEMENTS: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch wearables right now'
            }
          }
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
