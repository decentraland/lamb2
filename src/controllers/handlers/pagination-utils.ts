import { PAGINATION_DEFAULTS } from '../../logic/pagination-constants'

/**
 * Ensures pagination object has valid defaults instead of undefined
 * Replaces magic numbers in handlers with centralized constants
 */
export function ensurePagination(pagination?: { pageNum: number; pageSize: number }) {
  return (
    pagination || {
      pageNum: PAGINATION_DEFAULTS.PAGE_NUM,
      pageSize: PAGINATION_DEFAULTS.PAGE_SIZE
    }
  )
}

/**
 * Validates pagination parameters and throws descriptive errors
 */
export function validatePagination(pagination: { pageNum: number; pageSize: number }) {
  if (pagination.pageNum < 1) {
    throw new Error('pageNum must be greater than 0')
  }

  if (pagination.pageSize < 1) {
    throw new Error('pageSize must be greater than 0')
  }

  if (pagination.pageSize > PAGINATION_DEFAULTS.MAX_PAGE_SIZE) {
    throw new Error(`pageSize must not exceed ${PAGINATION_DEFAULTS.MAX_PAGE_SIZE}`)
  }
}
