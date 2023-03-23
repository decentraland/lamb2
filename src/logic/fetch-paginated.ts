import { Pagination } from '../types'

export async function fetchAndPaginate<T>(
  address: string,
  fetchElements: (address: string) => Promise<T[]>,
  pagination: Pagination
) {
  const elements = await fetchElements(address)
  return {
    elements: elements.slice(pagination.offset, pagination.offset + pagination.limit),
    totalAmount: elements.length,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }
}
