import { Network } from '@dcl/schemas'
import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import { PAGINATION_DEFAULTS } from '../logic/pagination-constants'

const CACHE_DEFAULTS = {
  MAX_ENTRIES: 10000,
  TTL: PAGINATION_DEFAULTS.CACHE_TTL,
  // Ceiling on refreshes running detached from a request (see the serveStale branch below).
  MAX_BACKGROUND_REFRESHES: 50
} as const

/**
 * Monotonic milliseconds. Ages are measured against a clock that cannot step: on the wall clock an NTP
 * correction backwards pins every entry as fresh, and one forwards expires them all at once.
 */
function now(): number {
  return performance.now()
}

/** A cached result plus when it was stored, so each reader can judge its age against its own TTL. */
type CacheEntry<T> = {
  result: ElementsResult<T>
  storedAt: number
  generation: number
}

/**
 * Create a cache key that includes all parameters for caching
 */
function createCacheKey(
  address: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): string {
  const parts = [address.toLowerCase()]

  if (pagination) {
    parts.push(`p${pagination.pageSize}-${pagination.pageNum}`)
  }

  if (filters && Object.keys(filters).length > 0) {
    const filterParts = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b)) // Consistent ordering
      .map(([key, value]) => `${key}:${value}`)

    if (filterParts.length > 0) {
      parts.push(`f${filterParts.join('|')}`)
    }
  }

  return parts.join('_')
}

export type ElementsResult<T> = {
  elements: T[]
  totalAmount: number
}

export type ItemType = 'wearable' | 'emote' | 'smartWearable'

export type ElementsFilters = {
  category?: string
  rarity?: string
  name?: string
  orderBy?: string
  direction?: string
  itemType?: ItemType
  network?: Network
}

export type LegacyElementsFetcher<T> = IBaseComponent & {
  fetchOwnedElements(address: string): Promise<T[]>
}

export type FetchElementsOptions = {
  /**
   * How old a cached entry may be, in ms, before THIS caller considers it stale. Defaults to
   * PAGINATION_DEFAULTS.CACHE_TTL.
   *
   * The default suits looking at SOMEONE ELSE's items, where minutes-old data is fine. It is far too
   * long for a caller reading its own inventory right after changing it — buying, selling or
   * transferring an item and then being served the pre-change list reads as the change having failed.
   *
   * This is evaluated per READ rather than stored with the entry on purpose. The cache is shared by
   * callers that disagree about acceptable age, and their keys collide: /explorer/:address/emotes and
   * the profiles path both key on nothing but the address. Storing the TTL alongside the value let
   * whichever caller happened to write first decide for everyone — a profile fetch would pin the entry
   * as "fresh" for ten minutes and the backpack, asking for twenty seconds, was handed the stale list
   * with no refresh. Freshness has to belong to the question being asked, not to the entry.
   */
  ttl?: number
  /**
   * Answer with an entry that is stale for this caller and refresh it behind the request, instead of
   * making the caller wait. Opt-in: a route that is READING OWNERSHIP to make a decision (who owns a
   * NAME, who may deploy to a parcel) must keep failing closed when the upstream is down rather than
   * confidently serving an old answer, which is what it did before this existed.
   */
  serveStale?: boolean
}

export type ElementsFetcher<T> = IBaseComponent & {
  fetchOwnedElements(
    address: string,
    pagination?: { pageSize: number; pageNum: number },
    filters?: ElementsFilters,
    options?: FetchElementsOptions
  ): Promise<ElementsResult<T>>
  clearCache?(): void
}

// `metrics` is optional so every existing construction site and test keeps compiling: without it the
// counters below are simply not recorded.
export type ElementsFetcherDependencies = Pick<AppComponents, 'logs' | 'theGraph' | 'marketplaceApiFetcher'> &
  Partial<Pick<AppComponents, 'metrics'>>

export class FetcherError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function createElementsFetcherComponent<T>(
  dependencies: ElementsFetcherDependencies,
  fetchElements: (
    deps: ElementsFetcherDependencies,
    address: string,
    pagination?: { pageSize: number; pageNum: number },
    filters?: ElementsFilters
  ) => Promise<ElementsResult<T>>
): ElementsFetcher<T> {
  const { logs, metrics } = dependencies
  const logger = logs.getLogger('elements-fetcher')

  // Entries carry WHEN they were stored, because each caller decides for itself how old is too old
  // (see FetchElementsOptions.ttl). The lru ttl is only a retention ceiling now; `allowStale` and
  // `noDeleteOnStaleGet` are load-bearing TOGETHER to make that possible — without the latter, reading
  // an entry past the lru ttl would delete it, so a caller willing to serve it would find nothing.
  const cache = createLowerCaseKeysCache<CacheEntry<T>>({
    max: CACHE_DEFAULTS.MAX_ENTRIES,
    ttl: CACHE_DEFAULTS.TTL,
    allowStale: true,
    noDeleteOnStaleGet: true
  })

  // One in-flight load per key, so N concurrent readers cause ONE upstream fetch.
  const refreshing = new Map<string, Promise<ElementsResult<T>>>()
  // Detached refreshes only — see the serveStale branch for why this is not `refreshing.size`.
  let backgroundRefreshes = 0
  // Bumped by clearCache so a load started before it cannot write its pre-clear result back in.
  let generation = 0

  function load(
    cacheKey: string,
    address: string,
    pagination?: { pageSize: number; pageNum: number },
    filters?: ElementsFilters
  ): Promise<ElementsResult<T>> {
    const inFlight = refreshing.get(cacheKey)
    if (inFlight) {
      return inFlight
    }

    const startedAt = generation
    const promise = fetchElements(dependencies, address.toLowerCase(), pagination, filters)
      .then((result) => {
        if (startedAt !== generation) {
          return result
        }
        cache.set(cacheKey, { result, storedAt: now(), generation })
        return result
      })
      .finally(() => {
        // Only retract our own entry: clearCache() may have dropped it and a newer load may own the slot.
        if (refreshing.get(cacheKey) === promise) {
          refreshing.delete(cacheKey)
        }
      })

    refreshing.set(cacheKey, promise)
    return promise
  }

  return {
    async fetchOwnedElements(
      address: string,
      pagination?: { pageSize: number; pageNum: number },
      filters?: ElementsFilters,
      options?: FetchElementsOptions
    ) {
      const cacheKey = createCacheKey(address, pagination, filters)
      const maxAge = options?.ttl ?? CACHE_DEFAULTS.TTL

      const entry = cache.get(cacheKey, { allowStale: true })
      const age = entry ? now() - entry.storedAt : Infinity
      if (entry && age <= maxAge) {
        metrics?.increment('elements_cache_reads_total', { result: 'fresh' })
        return entry.result
      }

      // Too old for this caller but recent enough to stand in: answer with it and refresh behind the
      // request, so a short TTL costs latency only on the very first read rather than on every expiry.
      //
      // The age ceiling is what keeps this from making things WORSE than no cache at all. Entries are
      // never dropped on their own (allowStale + noDeleteOnStaleGet, and lru-cache has no ttlAutopurge),
      // so without it an hours-old list would be served forever: the buyer who last opened their backpack
      // before the retention ceiling would be handed the pre-purchase list, where a plain expiring cache
      // would have refetched and shown the purchase. Past the ceiling we fall through and block.
      const withinRetention = age <= CACHE_DEFAULTS.TTL
      if (entry && options?.serveStale && withinRetention) {
        // The refresh is detached from the request, so nothing upstream throttles it: without a ceiling,
        // traffic across many addresses could fan out into unbounded concurrent full-inventory fetches.
        // Over the ceiling we simply answer stale and let a later request schedule the refresh.
        // Counted separately from `refreshing`, which also holds request-blocking loads: sharing that
        // number let a burst of ordinary traffic (a big POST /profiles fans out one load per id) spend
        // the whole budget, silently leaving the backpack stale with no refresh scheduled to heal it.
        if (backgroundRefreshes < CACHE_DEFAULTS.MAX_BACKGROUND_REFRESHES) {
          backgroundRefreshes++
          metrics?.increment('elements_cache_background_refresh_total', { outcome: 'started' })
          try {
            load(cacheKey, address, pagination, filters)
              .catch((err: any) => {
                // Keep the stack: this failure no longer reaches the request, so the log is all there is.
                metrics?.increment('elements_cache_background_refresh_total', { outcome: 'failed' })
                logger.warn(`Background refresh failed for ${address}, serving stale`, {
                  error: err?.stack ?? err?.message ?? String(err)
                })
              })
              .finally(() => {
                backgroundRefreshes--
              })
          } catch (err: any) {
            // A synchronous throw out of fetchElements never becomes a promise, so nothing above would
            // have decremented or logged it.
            backgroundRefreshes--
            metrics?.increment('elements_cache_background_refresh_total', { outcome: 'failed' })
            logger.warn(`Background refresh threw for ${address}, serving stale`, {
              error: err?.stack ?? err?.message ?? String(err)
            })
          }
        } else {
          // Only visible as a metric: the request still succeeds, it just stops self-healing.
          metrics?.increment('elements_cache_background_refresh_total', { outcome: 'skipped' })
        }
        metrics?.increment('elements_cache_reads_total', { result: 'stale' })
        return entry.result
      }

      try {
        metrics?.increment('elements_cache_reads_total', { result: entry ? 'expired' : 'miss' })
        return await load(cacheKey, address, pagination, filters)
      } catch (err: any) {
        logger.error(err)
        throw new FetcherError(`Cannot fetch elements for ${address}`)
      }
    },

    clearCache() {
      // Clear all cached entries - useful for tests
      generation++
      cache.clear()
      refreshing.clear()
      backgroundRefreshes = 0
    }
  }
}

export function createLegacyElementsFetcherComponent<T>(
  { logs }: Pick<AppComponents, 'logs'>,
  fetchAllOwnedElements: (address: string) => Promise<T[]>
): LegacyElementsFetcher<T> {
  const logger = logs.getLogger('elements-fetcher')

  const cache = createLowerCaseKeysCache<T[]>({
    max: CACHE_DEFAULTS.MAX_ENTRIES,
    ttl: CACHE_DEFAULTS.TTL,
    fetchMethod: async function (address: string, staleValue: T[] | undefined) {
      try {
        const es = await fetchAllOwnedElements(address)
        return es
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  return {
    async fetchOwnedElements(address: string) {
      const allElements = await cache.fetch(address)

      if (allElements) {
        return allElements
      }

      throw new FetcherError(`Cannot fetch elements for ${address}`)
    }
  }
}
