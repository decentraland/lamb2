/**
 * Centralized pagination constants to eliminate magic numbers
 * and ensure consistency across the application
 */

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 100,
  PAGE_NUM: 1,
  MAX_PAGE_SIZE: 1000,
  CACHE_TTL: 600000 // 10 minutes
} as const

export const MARKETPLACE_API_DEFAULTS = {
  PAGE_SIZE: 1000,
  TIMEOUT: 10000 // 10 seconds
} as const
