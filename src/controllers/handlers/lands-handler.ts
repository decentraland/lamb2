import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, LAND, PaginatedResponse } from '../../types'

export async function landsHandler(
  context: HandlerContextWithPath<'landsFetcher' | 'logs', '/users/:address/lands'>
): Promise<PaginatedResponse<LAND>> {
  const { address } = context.params
  const { landsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<LAND>(() => landsFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
