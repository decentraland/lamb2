import { IBaseComponent } from '@well-known-components/interfaces'
import LRU from 'lru-cache'
import { AppComponents, ThirdParty, ThirdPartyResolversResponse } from '../types'

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id,
    resolver
  }
}
`

// Example:
//   "thirdParties": [
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
//       "resolver": "https://decentraland-api.babydoge.com/v1"
//     },
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
//       "resolver": "https://api.cryptoavatars.io/"
//     },
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
//       "resolver": "https://wearables-api.unxd.com"
//     }
//  ]

export type ThirdPartyProvidersFetcher = IBaseComponent & {
  get(): Promise<ThirdParty[]>
  // TODO Expose fetch?
}

export function createThirdPartyProvidersFetcherComponent({
  logs,
  theGraph
}: Pick<AppComponents, 'logs' | 'theGraph'>): ThirdPartyProvidersFetcher {
  const logger = logs.getLogger('elements-fetcher')

  const thirdPartiesCache = new LRU<number, ThirdParty[]>({
    max: 1,
    ttl: 1000 * 60 * 60 * 6, // 6 hours
    fetchMethod: async function (_: number, staleValue: ThirdParty[] | undefined) {
      try {
        const tpProviders = (
          await theGraph.thirdPartyRegistrySubgraph.query<ThirdPartyResolversResponse>(
            QUERY_ALL_THIRD_PARTY_RESOLVERS,
            {}
          )
        ).thirdParties
        return tpProviders
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })
  return {
    async start() {
      await thirdPartiesCache.fetch(0)
    },
    async get() {
      return thirdPartiesCache.get(0)!
    }
  }
}
