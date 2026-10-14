import { paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath } from '../../types'
import { NamesPaginated } from '@dcl/catalyst-api-specs/lib/client'
import { PAGINATION_DEFAULTS } from '../../logic/pagination-constants'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<{ status: 200; body: NamesPaginated }> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url, PAGINATION_DEFAULTS.MAX_PAGE_SIZE)

  const { elements, totalAmount } = await namesFetcher.fetchOwnedElements(address, pagination)
  const page = {
    elements,
    totalAmount,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }
  // Upstreams may still send the wei price as a number; the API always answers a string
  const elementsWithStringPrice = page.elements.map((name) => ({
    ...name,
    price: name.price !== undefined ? String(name.price) : undefined
  }))

  return {
    status: 200,
    body: {
      ...page,
      elements: elementsWithStringPrice
    }
  }
}
