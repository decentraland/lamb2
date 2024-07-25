import { AppComponents, ThirdPartyProvider } from '../types'

export type ThirdPartyProvidersGraphFetcher = {
  get(): Promise<ThirdPartyProvider[]>
}

type ThirdPartyResolversQueryResults = {
  thirdParties: ThirdPartyProvider[]
}

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id
    resolver
    metadata {
      thirdParty {
        name
        description
        contracts {
          network
          address
        }
      }
    }
  }
}
`

export function createThirdPartyProvidersGraphFetcherComponent({
  theGraph
}: Pick<AppComponents, 'theGraph'>): ThirdPartyProvidersGraphFetcher {
  return {
    async get(): Promise<ThirdPartyProvider[]> {
      const thirdPartyProviders = (
        await theGraph.thirdPartyRegistrySubgraph.query<ThirdPartyResolversQueryResults>(
          QUERY_ALL_THIRD_PARTY_RESOLVERS,
          {}
        )
      ).thirdParties

      if (thirdPartyProviders) {
        for (const thirdParty of thirdPartyProviders) {
          if (thirdParty.metadata.thirdParty?.contracts) {
            thirdParty.metadata.thirdParty.contracts = thirdParty.metadata.thirdParty.contracts.map((c) => ({
              network: c.network.toLowerCase(),
              address: c.address.toLowerCase()
            }))
          }
        }
      }

      return thirdPartyProviders
    }
  }
}
