import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Name, PaginatedResponse } from '../../types'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<PaginatedResponse<Name>> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<Name>(() => namesFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
