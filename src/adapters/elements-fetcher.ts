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

/** A cached result plus when it was stored, so each reader can judge its age against its own TTL. */
type CacheEntry<T> = {
  result: ElementsResult<T>
  storedAt: number
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

export type ElementsFetcherDependencies = Pick<AppComponents, 'logs' | 'theGraph' | 'marketplaceApiFetcher'>

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
  const { logs } = dependencies
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

    const promise = fetchElements(dependencies, address.toLowerCase(), pagination, filters)
      .then((result) => {
        cache.set(cacheKey, { result, storedAt: Date.now() })
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
      if (entry && Date.now() - entry.storedAt <= maxAge) {
        return entry.result
      }

      // Too old for this caller, but usable: answer with it and refresh behind the request, so a short
      // TTL costs latency only on the very first read rather than on every expiry.
      if (entry && options?.serveStale) {
        // The refresh is detached from the request, so nothing upstream throttles it: without a ceiling,
        // traffic across many addresses could fan out into unbounded concurrent full-inventory fetches.
        // Over the ceiling we simply answer stale and let a later request schedule the refresh.
        if (refreshing.size < CACHE_DEFAULTS.MAX_BACKGROUND_REFRESHES) {
          load(cacheKey, address, pagination, filters).catch((err: any) => {
            // Keep the stack: this failure no longer reaches the request, so the log is all there is.
            logger.warn(`Background refresh failed for ${address}, serving stale`, {
              error: err?.stack ?? err?.message ?? String(err)
            })
          })
        }
        return entry.result
      }

      try {
        return await load(cacheKey, address, pagination, filters)
      } catch (err: any) {
        logger.error(err)
        throw new FetcherError(`Cannot fetch elements for ${address}`)
      }
    },

    clearCache() {
      // Clear all cached entries - useful for tests
      cache.clear()
      refreshing.clear()
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
