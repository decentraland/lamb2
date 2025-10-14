import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
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

export type ElementsFilters = {
  category?: string
  rarity?: string
  name?: string
  orderBy?: string
  direction?: string
  itemType?: string
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

  // Universal cache that stores complete ElementsResult for any parameter combination
  const cache = createLowerCaseKeysCache<ElementsResult<T>>({
    max: CACHE_DEFAULTS.MAX_ENTRIES,
    ttl: CACHE_DEFAULTS.TTL
    // No fetchMethod needed - we handle cache manually with get/set
  })

  return {
    async fetchOwnedElements(
      address: string,
      pagination?: { pageSize: number; pageNum: number },
      filters?: ElementsFilters
    ) {
      // Always try cache first with intelligent key
      const cacheKey = createCacheKey(address, pagination, filters)

      // Check if we have this exact combination cached
      const cachedResult = cache.get(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      // Not in cache, fetch from API/Graph and cache the result
      try {
        // Convert address to lowercase for consistency (as the original cache did)
        const normalizedAddress = address.toLowerCase()
        const result = await fetchElements(dependencies, normalizedAddress, pagination, filters)

        // Cache the complete result for future requests with same parameters
        cache.set(cacheKey, result)

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
