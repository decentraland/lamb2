import LRU from 'lru-cache'
import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'

export type ElementsResult<T> = {
  elements: T[]
  totalAmount: number
}

export type ElementsFetcher<T> = IBaseComponent & {
  fetchOwnedElements(address: string): Promise<T[]>
}

export enum FetcherErrorCode {
  CANNOT_FETCH_ELEMENTS,
  THIRD_PARTY_NOT_FOUND,
  CANNOT_FETCH_THIRD_PARTIES
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
    async fetchOwnedElements(address: string) {
      const allElements = await cache.fetch(address)

      if (allElements) {
        return allElements
      }

      throw new FetcherError(FetcherErrorCode.CANNOT_FETCH_ELEMENTS, `Cannot fetch elements for ${address}`)
    }
  }
}
