import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, Name, PaginatedResponse } from '../../types'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<PaginatedResponse<Name> | ErrorResponse> {
  const { address } = context.params
  const { namesFetcher, logs } = context.components
  const pagination = paginationObject(context.url)
  const logger = logs.getLogger('names-handler')

  try {
    const page = await fetchAndPaginate<Name>(address, namesFetcher.fetchOwnedElements, pagination)
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
          error: 'Cannot fetch names right now'
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
