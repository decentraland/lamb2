import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Operator } from '../../types'

export async function operatorsHandler(
  context: HandlerContextWithPath<'operatorsFetcher', '/users/:address/operators'>
): Promise<{ status: 200; body: { elements: Operator[]; totalAmount: number; pageNum: number; pageSize: number } }> {
  const { address } = context.params
  const { operatorsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<Operator>(() => operatorsFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
