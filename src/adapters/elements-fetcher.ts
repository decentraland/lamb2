import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits } from '../types'

export type ElementsResult<T> = {
  elements: T[]
  totalAmount: number
}

export type ElementsFetcher<T> = IBaseComponent & {
  fetchByOwner(address: string, limits: Limits): Promise<ElementsResult<T>>
}

export enum FetcherErrorCode {
  CANNOT_FETCH_ELEMENTS
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
    fetchMethod: async function (address: string, staleValue: T[]) {
      try {
        const es = await fetchAllOwnedElements(address)
        return es
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<ElementsResult<T>> {
    const allElements = await cache.fetch(address)

    if (allElements === undefined) {
      throw new FetcherError(FetcherErrorCode.CANNOT_FETCH_ELEMENTS, `Cannot fetch elements for ${address}`)
    }

    const totalAmount = allElements.length
    return {
      elements: allElements.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}
