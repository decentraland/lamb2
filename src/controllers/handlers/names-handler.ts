import { paginationObject } from '../../logic/utils'
import { ErrorResponse, HandlerContextWithPath, Name, PaginatedResponse } from '../../types'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher', '/users/:address/names'>
): Promise<PaginatedResponse<Name> | ErrorResponse> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url)

  const { names, totalAmount } = await namesFetcher.fetchByOwner(address, pagination)

  return {
    status: 200,
    body: {
      elements: names,
      totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}
