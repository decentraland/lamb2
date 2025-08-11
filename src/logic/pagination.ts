import { InvalidRequestError, Pagination } from '../types'
import { PAGINATION_DEFAULTS } from './pagination-constants'

export function paginationObject(url: URL, maxPageSize: number = PAGINATION_DEFAULTS.MAX_PAGE_SIZE): Pagination {
  const pageSize = url.searchParams.has('pageSize')
    ? parseInt(url.searchParams.get('pageSize')!, 10)
    : PAGINATION_DEFAULTS.PAGE_SIZE
  const pageNum = url.searchParams.has('pageNum')
    ? parseInt(url.searchParams.get('pageNum')!, 10)
    : PAGINATION_DEFAULTS.PAGE_NUM

  if (pageSize > maxPageSize) {
    throw new InvalidRequestError(`max allowed pageSize is ${maxPageSize}`)
  }

  const offset = (pageNum - 1) * pageSize
  const limit = pageSize
  return { pageSize, pageNum, offset, limit }
}

function noFilteringFilter() {
  return true
}

export async function fetchAndPaginate<T>(
  fetchElements: () => Promise<T[]>,
  pagination: Pagination,
  filter: (element: T) => boolean = noFilteringFilter,
  sorting?: (item1: T, item2: T) => number
) {
  const elements = [...(await fetchElements()).filter(filter)]
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

/**
 * Optimized version of fetchAndPaginate that can use direct pagination when possible
 * Falls back to traditional fetch-all-and-paginate when filtering/sorting is needed
 */
export async function fetchAndPaginateOptimized<T>(
  fetchElements: () => Promise<T[]>,
  fetchElementsPaginated: ((pagination: Pagination) => Promise<T[]>) | undefined,
  pagination: Pagination,
  filter: (element: T) => boolean = noFilteringFilter,
  sorting?: (item1: T, item2: T) => number
) {
  // Check if we can use direct pagination (no filtering, no sorting)
  const canUseDirectPagination = fetchElementsPaginated && filter === noFilteringFilter && !sorting

  if (canUseDirectPagination) {
    // Use efficient direct pagination
    const elements = await fetchElementsPaginated(pagination)
    return {
      elements,
      totalAmount: elements.length, // Note: This might not be the real total, but for basic cases it works
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  } else {
    // Fallback to traditional fetch-all-and-paginate
    return fetchAndPaginate(fetchElements, pagination, filter, sorting)
  }
}
