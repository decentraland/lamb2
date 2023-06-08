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

      return thirdPartyProviders
    }
  }
}
