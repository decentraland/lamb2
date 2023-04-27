import { Pagination } from '../types'

export function paginationObject(url: URL): Pagination {
  const pageSize = url.searchParams.has('pageSize') ? parseInt(url.searchParams.get('pageSize')!, 10) : 100
  const pageNum = url.searchParams.has('pageNum') ? parseInt(url.searchParams.get('pageNum')!, 10) : 1

  const offset = (pageNum - 1) * pageSize
  const limit = pageSize
  return { pageSize, pageNum, offset, limit }
}

function noFilteringFilter() {
  return true
}

export async function fetchAndPaginate<T>(
  address: string,
  fetchElements: (address: string) => Promise<T[]>,
  pagination: Pagination,
  filter: (element: T) => boolean = noFilteringFilter,
  sorting?: (item1: T, item2: T) => number
) {
  const elements = [...(await fetchElements(address)).filter(filter)]
  if (sorting) {
    elements.sort(sorting) // sorting changes the original array
  }
  return {
    elements: elements.slice(pagination.offset, pagination.offset + pagination.limit),
    totalAmount: elements.length,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }
}
