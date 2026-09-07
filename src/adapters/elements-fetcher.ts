import { Network } from '@dcl/schemas'
import { AppComponents, InvalidRequestError, ServiceOverloadedError } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import LRU from 'lru-cache'
import { PAGINATION_DEFAULTS } from '../logic/pagination-constants'

const CACHE_DEFAULTS = {
  MAX_ENTRIES: 10000,
  TTL: PAGINATION_DEFAULTS.CACHE_TTL
} as const

export type ElementsCacheOptions = {
  /** Entries kept across all keys (addresses × page/filter combinations). */
  maxEntries: number
  /** Milliseconds an entry is served as fresh before a request triggers its refresh. */
  maxAge: number
}

/**
 * Short by design. Ownership answers drive profile validation, and a wearable bought a moment ago
 * must not be stripped from an avatar for long. Stale entries are still served instantly while
 * one refresh runs in the background, so a short age costs one upstream fetch per hot key per
 * minute, not one per request.
 */
export const ELEMENTS_CACHE_DEFAULTS: ElementsCacheOptions = { maxEntries: 10000, maxAge: 60_000 }

/**
 * Linked wearables keep the previous ten minutes. Filling an entry means asking the NFT worker for
 * the wallet's tokens across every registered contract and then the content server for the matching
 * collections, and the tokens change rarely; their presence on a profile is validated per item
 * through the ownership checker, not through this cache, so a longer age costs no correctness there.
 */
export const THIRD_PARTY_WEARABLES_CACHE_DEFAULTS: ElementsCacheOptions = { maxEntries: 10000, maxAge: 600_000 }

export type ElementsCacheSettings = {
  elements: ElementsCacheOptions
  thirdPartyWearables: ElementsCacheOptions
}

export async function readElementsCacheSettings(config: AppComponents['config']): Promise<ElementsCacheSettings> {
  async function integerSetting(name: string, fallback: number): Promise<number> {
    const value = await config.getNumber(name)
    if (value === undefined) {
      return fallback
    }
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${name} must be a positive integer, got ${String(value)}`)
    }
    return value
  }

  const maxEntries = await integerSetting('ELEMENTS_CACHE_MAX_SIZE', ELEMENTS_CACHE_DEFAULTS.maxEntries)

  return {
    elements: {
      maxEntries,
      maxAge: await integerSetting('ELEMENTS_CACHE_MAX_AGE', ELEMENTS_CACHE_DEFAULTS.maxAge)
    },
    thirdPartyWearables: {
      maxEntries,
      maxAge: await integerSetting('THIRD_PARTY_WEARABLES_CACHE_MAX_AGE', THIRD_PARTY_WEARABLES_CACHE_DEFAULTS.maxAge)
    }
  }
}

/**
 * Create a cache key that includes all parameters for caching.
 *
 * Filter values are lowercased on purpose: every filter is matched case-insensitively downstream
 * (the marketplace uses ILIKE for `name`, categories and rarities are lowercase enums, sort
 * fields are normalised by both backends), so `Foo` and `foo` are the same request and share one
 * entry and one in-flight fetch.
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
      .map(([key, value]) => `${key}:${String(value).toLowerCase()}`)

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

export type ElementsFetcher<T> = IBaseComponent & {
  fetchOwnedElements(
    address: string,
    pagination?: { pageSize: number; pageNum: number },
    filters?: ElementsFilters
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
  ) => Promise<ElementsResult<T>>,
  options: ElementsCacheOptions = ELEMENTS_CACHE_DEFAULTS
): ElementsFetcher<T> {
  const { logs } = dependencies
  const logger = logs.getLogger('elements-fetcher')

  type FetchContext = {
    address: string
    pagination?: { pageSize: number; pageNum: number }
    filters?: ElementsFilters
  }

  async function fetchForKey(
    _key: string,
    _staleValue: ElementsResult<T> | undefined,
    { context }: { context: FetchContext }
  ): Promise<ElementsResult<T>> {
    return fetchElements(dependencies, context.address.toLowerCase(), context.pagination, context.filters)
  }

  // `fetch` hands every caller of a key the same in-flight promise, so concurrent misses for one
  // address cost a single upstream fetch. With `allowStale`, an expired entry is answered at once
  // while a single background refresh runs, so freshness does not cost latency or fan-out.
  const cache = new LRU<string, ElementsResult<T>, FetchContext>({
    max: options.maxEntries,
    ttl: options.maxAge,
    allowStale: true,
    fetchMethod: fetchForKey
  })

  return {
    async fetchOwnedElements(
      address: string,
      pagination?: { pageSize: number; pageNum: number },
      filters?: ElementsFilters
    ) {
      const cacheKey = createCacheKey(address, pagination, filters)

      try {
        const result = await cache.fetch(cacheKey, { context: { address, pagination, filters } })
        if (!result) {
          throw new Error('The elements fetch resolved without a result')
        }

        return result
      } catch (err: any) {
        // A rejected request is the caller's fault and shed load is a retryable overload: neither
        // is an upstream failure, so neither is reported as a 502.
        if (err instanceof InvalidRequestError || err instanceof ServiceOverloadedError) {
          throw err
        }

        logger.error(err)
        throw new FetcherError(`Cannot fetch elements for ${address}`)
      }
    },

    clearCache() {
      // Clear all cached entries - useful for tests
      cache.clear()
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
