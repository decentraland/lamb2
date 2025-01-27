import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { AppComponents, ThirdPartyProvider } from '../types'
import LRU from 'lru-cache'
import { FetcherError } from '../adapters/elements-fetcher'
import { IBaseComponent } from '@well-known-components/interfaces'
import { findAsync } from './utils'

export type ThirdPartyProvidersStorage = IBaseComponent & {
  getAll(): Promise<ThirdPartyProvider[]>
  get(thirdPartyNameUrn: BlockchainCollectionThirdPartyName): Promise<ThirdPartyProvider | undefined>
}

type WrappedCallResponse = {
  ok: boolean
  thirdPartyProviders?: ThirdPartyProvider[]
}

async function wrapCall(asyncFn: () => Promise<ThirdPartyProvider[]>): Promise<WrappedCallResponse> {
  try {
    const thirdPartyProviders = await asyncFn()
    return { thirdPartyProviders, ok: true }
  } catch (error: any) {
    return { ok: false }
  }
}

export async function createThirdPartyProvidersStorage({
  logs,
  thirdPartyProvidersGraphFetcher
}: Pick<AppComponents, 'logs' | 'thirdPartyProvidersGraphFetcher'>): Promise<ThirdPartyProvidersStorage> {
  const logger = logs.getLogger('third-party-providers-storage')

  const cache = new LRU<number, ThirdPartyProvider[]>({
    max: 1,
    ttl: 1000 * 60 * 60 * 6,
    fetchMethod: async function (_: number, staleValue: ThirdPartyProvider[] | undefined) {
      logger.info('Fetching Third Party Providers from TheGraph')
      const response = await wrapCall(async (): Promise<ThirdPartyProvider[]> => {
        return await thirdPartyProvidersGraphFetcher.get()
      })

      return response.ok ? response.thirdPartyProviders : staleValue
    }
  })

  async function getAll() {
    const thirdParties = await cache.fetch(0)
    if (thirdParties) {
      return thirdParties
    }
    throw new FetcherError(`Cannot fetch third party providers`)
  }

  async function get(thirdPartyProviderNameUrn: BlockchainCollectionThirdPartyName) {
    return await findAsync(await getAll(), async (thirdParty: ThirdPartyProvider): Promise<boolean> => {
      const urn = await parseUrn(thirdParty.id)
      return (
        !!urn &&
        urn.type === 'blockchain-collection-third-party-name' &&
        urn.thirdPartyName === thirdPartyProviderNameUrn.thirdPartyName
      )
    })
  }

  async function start() {
    await getAll()
  }

  return {
    get,
    getAll,
    start
  }
}
