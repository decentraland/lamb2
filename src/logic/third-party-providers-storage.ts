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
  thirdPartyProvidersGraphFetcher,
  thirdPartyProvidersServiceFetcher
}: Pick<
  AppComponents,
  'logs' | 'thirdPartyProvidersGraphFetcher' | 'thirdPartyProvidersServiceFetcher'
>): Promise<ThirdPartyProvidersStorage> {
  const logger = logs.getLogger('third-party-providers-storage')

  const cache = new LRU<number, ThirdPartyProvider[]>({
    max: 1,
    ttl: 1000 * 60 * 60 * 6,
    fetchMethod: async function (_: number, staleValue: ThirdPartyProvider[] | undefined) {
      logger.info('Fetching Third Party Providers from service')
      let response = await wrapCall(async (): Promise<ThirdPartyProvider[]> => {
        return thirdPartyProvidersServiceFetcher.get()
      })

      if (!response.ok) {
        logger.info('Retry fetching Third Party Providers from TheGraph')
        response = await wrapCall(async (): Promise<ThirdPartyProvider[]> => {
          return await thirdPartyProvidersGraphFetcher.get()
        })
      }

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

  return {
    getAll,
    async start() {
      await getAll()
    },
    async get(thirdPartyProviderNameUrn: BlockchainCollectionThirdPartyName) {
      const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
      const thirdParty = await findAsync(await getAll(), async (thirdParty: ThirdPartyProvider): Promise<boolean> => {
        const urn = await parseUrn(thirdParty.id)
        return (
          !!urn &&
          urn.type === URN_THIRD_PARTY_NAME_TYPE &&
          urn.thirdPartyName === thirdPartyProviderNameUrn.thirdPartyName
        )
      })

      return thirdParty
    }
  }
}
