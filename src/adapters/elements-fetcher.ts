import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits } from '../types'

export type ElementsResult<T> = {
  elements: T[]
  totalAmount: number
}

export type ElementsFetcher<T> = IBaseComponent & {
  fetchByOwner(address: string, limits: Limits): Promise<ElementsResult<T>>
  fetchAllByOwner(address: string): Promise<ElementsResult<T>>
}

export enum FetcherErrorCode {
  CANNOT_FETCH_ELEMENTS,
  THIRD_PARTY_NOT_FOUND
}

export class FetcherError extends Error {
  constructor(public code: FetcherErrorCode, message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function createElementsFetcherComponent<T>(
  { logs }: Pick<AppComponents, 'logs'>,
  fetchAllOwnedElements: (address: string) => Promise<T[]>
): ElementsFetcher<T> {
  const logger = logs.getLogger('elements-fetcher')

  const cache = new LRU<string, T[]>({
    max: 1000,
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
    async fetchByOwner(address: string, { offset, limit }: Limits): Promise<ElementsResult<T>> {
      const allElements = await cache.fetch(address)

      if (allElements) {
        const totalAmount = allElements.length
        return {
          elements: allElements.slice(offset, offset + limit),
          totalAmount
        }
      }

      throw new FetcherError(FetcherErrorCode.CANNOT_FETCH_ELEMENTS, `Cannot fetch elements for ${address}`)
    },
    async fetchAllByOwner(address: string): Promise<ElementsResult<T>> {
      const elements = await cache.fetch(address)

      if (elements === undefined || !elements) {
        throw new FetcherError(FetcherErrorCode.CANNOT_FETCH_ELEMENTS, `Cannot fetch elements for ${address}`)
      }

      const totalAmount = elements.length
      return {
        elements,
        totalAmount
      }
    }
  }
}
