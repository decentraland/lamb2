import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'

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
}

export class FetcherError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function createElementsFetcherComponent<T>(
  { logs }: Pick<AppComponents, 'logs'>,
  fetchAllOwnedElements: (
    address: string,
    pagination?: { pageSize: number; pageNum: number },
    filters?: ElementsFilters
  ) => Promise<ElementsResult<T>>
): ElementsFetcher<T> {
  const logger = logs.getLogger('elements-fetcher')

  const cache = createLowerCaseKeysCache<T[]>({
    max: 10000,
    ttl: 600000, // 10 minutes
    fetchMethod: async function (address: string, staleValue: T[] | undefined) {
      try {
        const result = await fetchAllOwnedElements(address)
        // For cache, we only store the elements array (backward compatibility)
        return result.elements
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  return {
    async fetchOwnedElements(
      address: string,
      pagination?: { pageSize: number; pageNum: number },
      filters?: ElementsFilters
    ) {
      // If pagination is provided, bypass cache and fetch directly
      if (pagination) {
        try {
          return await fetchAllOwnedElements(address, pagination, filters)
        } catch (err: any) {
          logger.error(err)
          throw new FetcherError(`Cannot fetch elements for ${address}`)
        }
      }

      // Otherwise, use cached behavior for backward compatibility
      const allElements = await cache.fetch(address)

      if (allElements) {
        return {
          elements: allElements,
          totalAmount: allElements.length
        }
      }

      throw new FetcherError(`Cannot fetch elements for ${address}`)
    }
  }
}

export function createLegacyElementsFetcherComponent<T>(
  { logs }: Pick<AppComponents, 'logs'>,
  fetchAllOwnedElements: (address: string) => Promise<T[]>
): LegacyElementsFetcher<T> {
  const logger = logs.getLogger('elements-fetcher')

  const cache = createLowerCaseKeysCache<T[]>({
    max: 10000,
    ttl: 600000, // 10 minutes
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
