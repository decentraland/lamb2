import { BlockchainCollectionThirdPartyName } from '@dcl/urn-resolver'
import { IBaseComponent } from '@well-known-components/interfaces'
import LRU from 'lru-cache'
import { findAsync, parseUrn } from '../logic/utils'
import { AppComponents, ThirdParty } from '../types'
import { FetcherError } from './elements-fetcher'

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id
    resolver
    metadata {
      thirdParty {
        name
        description
      }
    }
  }
}
`

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'

export type ThirdPartyResolversQueryResults = {
  thirdParties: ThirdParty[]
}

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
  getAll(): Promise<ThirdParty[]>
  get(thirdPartyNameUrn: BlockchainCollectionThirdPartyName): Promise<ThirdParty | undefined>
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
          await theGraph.thirdPartyRegistrySubgraph.query<ThirdPartyResolversQueryResults>(
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

  async function getAll() {
    const thirdParties = await thirdPartiesCache.fetch(0)
    if (thirdParties) {
      return thirdParties
    }
    throw new FetcherError(`Cannot fetch third party providers`)
  }

  return {
    async start() {
      await getAll()
    },
    getAll,
    async get(thirdPartyNameUrn: BlockchainCollectionThirdPartyName) {
      const thirdParty = await findAsync(await getAll(), async (thirdParty: ThirdParty): Promise<boolean> => {
        const urn = await parseUrn(thirdParty.id)
        return (
          !!urn && urn.type === URN_THIRD_PARTY_NAME_TYPE && urn.thirdPartyName === thirdPartyNameUrn.thirdPartyName
        )
      })

      return thirdParty
    }
  }
}
