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

/**
 * How the /explorer/:address/* routes read the item cache. Those routes are how the explorer renders the
 * signed-in user's OWN backpack. Minutes of staleness are fine for browsing someone else's items, but not
 * for your own inventory right after you changed it: on the default TTL, buying an item in-world and
 * reopening the backpack served the pre-purchase list — the purchase looked lost. Same in reverse once a
 * sale transfers an item out and it lingers in the list.
 *
 * Kept as a TTL rather than dropped altogether because a miss here is expensive (the handler pulls the
 * user's whole item list from the marketplace API), and paired with `serveStale` so that cost lands on
 * the first read instead of on every expiry. Note this bounds staleness PER PROCESS: the cache is
 * in-memory, so what a user experiences also depends on which replica they land on, and no TTL can
 * guarantee a correct read straight after a purchase — only invalidation could.
 */
export const EXPLORER_CACHE_OPTIONS = {
  ttl: 20000, // 20 seconds
  serveStale: true
} as const

export const MARKETPLACE_API_DEFAULTS = {
  PAGE_SIZE: 1000,
  TIMEOUT: 10000 // 10 seconds
} as const
