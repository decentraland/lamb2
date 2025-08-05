import { paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath } from '../../types'
import { NamesPaginated } from '@dcl/catalyst-api-specs/lib/client'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<{ status: 200; body: NamesPaginated }> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const { elements, totalAmount } = await namesFetcher.fetchOwnedElements(address, pagination)
  const page = {
    elements,
    totalAmount,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }
  // Convert price from number to string for API compatibility
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
