import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Operator } from '../../types'

export async function permissionsHandler(
  context: HandlerContextWithPath<'permissionsFetcher', '/users/:address/permissions'>
): Promise<{ status: 200; body: { elements: Operator[]; totalAmount: number; pageNum: number; pageSize: number } }> {
  const { address } = context.params
  const { permissionsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<Operator>(() => permissionsFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
