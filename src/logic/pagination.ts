import { InvalidRequestError, Pagination } from '../types'
import { ElementsFetcher } from '../adapters/elements-fetcher'

export function paginationObject(url: URL, maxPageSize: number = 1000): Pagination {
  const pageSize = url.searchParams.has('pageSize') ? parseInt(url.searchParams.get('pageSize')!, 10) : 100
  const pageNum = url.searchParams.has('pageNum') ? parseInt(url.searchParams.get('pageNum')!, 10) : 1
  console.log('pageSize', pageSize)
  console.log('pageNum', pageNum)

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
  console.log('fetchAndPaginate', pagination)
  const elements = [...(await fetchElements()).filter(filter)]
  if (sorting) {
    elements.sort(sorting) // sorting changes the original array
  }
  console.log('elements', elements)
  return {
    elements: elements.slice(pagination.offset, pagination.offset + pagination.limit),
    totalAmount: elements.length,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }
}

/**
 * Fetches paginated results directly from a paginated fetcher (marketplace-api)
 * Falls back to local filtering/sorting if the fetcher returns unsorted results
 */
export async function fetchAndPaginateWithFetcher<T>(
  fetcher: ElementsFetcher<T>,
  address: string,
  pagination: Pagination,
  filter: (element: T) => boolean = noFilteringFilter,
  sorting?: (item1: T, item2: T) => number
): Promise<{
  elements: T[]
  totalAmount: number
  pageNum: number
  pageSize: number
}> {
  console.log('fetchAndPaginateWithFetcher', { address, pagination })

  try {
    // Try to get paginated results directly from marketplace-api
    const result = await fetcher.fetchOwnedElementsPaginated(address, pagination.limit, pagination.offset)

    // Apply filtering and sorting if needed
    const elements = [...result.elements.filter(filter)]
    if (sorting) {
      elements.sort(sorting)
    }

    console.log('fetchAndPaginateWithFetcher - direct result', {
      returned: elements.length,
      total: result.totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })

    return {
      elements,
      totalAmount: result.totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  } catch (error) {
    console.log('fetchAndPaginateWithFetcher - falling back to local pagination', error)
    // Fallback to the old method if paginated fetch fails
    const elements = [...(await fetcher.fetchOwnedElements(address)).filter(filter)]
    if (sorting) {
      elements.sort(sorting)
    }

    return {
      elements: elements.slice(pagination.offset, pagination.offset + pagination.limit),
      totalAmount: elements.length,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}
