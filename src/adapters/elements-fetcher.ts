import { Network } from '@dcl/schemas'
import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import LRU from 'lru-cache'
import { PAGINATION_DEFAULTS } from '../logic/pagination-constants'

const CACHE_DEFAULTS = {
  MAX_ENTRIES: 10000,
  TTL: PAGINATION_DEFAULTS.CACHE_TTL
} as const

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
  ) => Promise<ElementsResult<T>>
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
  // address cost a single upstream fetch and an expiring hot entry is refreshed once, not by all.
  const cache = new LRU<string, ElementsResult<T>, FetchContext>({
    max: CACHE_DEFAULTS.MAX_ENTRIES,
    ttl: CACHE_DEFAULTS.TTL,
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
        // Lowercased as the shared cache wrapper does, so the key stays case-insensitive.
        const result = await cache.fetch(cacheKey.toLowerCase(), { context: { address, pagination, filters } })
        if (!result) {
          throw new Error('The elements fetch resolved without a result')
        }

        return result
      } catch (err: any) {
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
