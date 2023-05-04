import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, LAND, PaginatedResponse } from '../../types'

export async function landsHandler(
  context: HandlerContextWithPath<'landsFetcher' | 'logs', '/users/:address/lands'>
): Promise<PaginatedResponse<LAND> | ErrorResponse> {
  const { address } = context.params
  const { landsFetcher, logs } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const logger = logs.getLogger('lands-handler')

  try {
    const page = await fetchAndPaginate<LAND>(address, landsFetcher.fetchOwnedElements, pagination)
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
          error: 'Cannot fetch lands right now'
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
