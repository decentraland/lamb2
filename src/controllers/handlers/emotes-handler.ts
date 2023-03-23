import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { Definition, ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse } from '../../types'

// TODO: change this name
type ItemResponse = Item & {
  definition?: Definition
}

export async function emotesHandler(
  context: HandlerContextWithPath<'logs' | 'emotesFetcher' | 'definitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('emotes-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const page = await fetchAndPaginate<ItemResponse>(address, emotesFetcher.fetchOwnedElements, pagination)

    if (includeDefinitions) {
      const wearables = page.elements
      const definitions = await definitionsFetcher.fetchEmotesDefinitions(wearables.map((wearable) => wearable.urn))
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
          error: 'Cannot fetch emotes right now'
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
