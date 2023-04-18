import { AppComponents } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'

export type ElementsResult<T> = {
  elements: T[]
  totalAmount: number
}

export type ElementsFetcher<T> = IBaseComponent & {
  fetchOwnedElements(address: string): Promise<T[]>
}

export class FetcherError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function createElementsFetcherComponent<T>(
  { logs }: Pick<AppComponents, 'logs'>,
  fetchAllOwnedElements: (address: string) => Promise<T[]>
): ElementsFetcher<T> {
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
