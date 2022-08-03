import { IBaseComponent, IConfigComponent } from '@well-known-components/interfaces'
import { ISubgraphComponent, createSubgraphComponent } from '@well-known-components/thegraph-component'
import { AppComponents } from '../types'

export type TheGraphComponent = IBaseComponent & {
  collectionsSubgraph: ISubgraphComponent
  maticCollectionsSubgraph: ISubgraphComponent
  ensSubgraph: ISubgraphComponent
}

const QUERY_THIRD_PARTY_RESOLVER = `
query ThirdPartyResolver($id: String!) {
  thirdParties(where: {id: $id, isApproved: true}) {
    id
    resolver
  }
}
`

const DEFAULT_COLLECTIONS_SUBGRAPH_ROPSTEN = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-ropsten'
const DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-mainnet'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MUMBAI = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mumbai'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet'
const DEFAULT_ENS_OWNER_PROVIDER_URL_ROPSTEN = 'https://api.thegraph.com/subgraphs/name/decentraland/marketplace-ropsten'
const DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET = 'https://api.thegraph.com/subgraphs/name/decentraland/marketplace'

export async function createTheGraphComponent(components: Pick<AppComponents, 'config' | 'logs' | 'fetch' | 'metrics'>): Promise<TheGraphComponent> {

  const { config } = components

  // const DEFAULT_ETH_NETWORK = 'ropsten'
  
  // const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MUMBAI = 'https://api.thegraph.com/subgraphs/name/decentraland/tpr-matic-mumbai'
  // const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET = 'https://api.thegraph.com/subgraphs/name/decentraland/tpr-matic-mainnet'

  const ethNetwork = await config.getString('ETH_NETWORK')
  const collectionsSubgraphURL: string = await config.getString('COLLECTIONS_L1_SUBGRAPH_URL') ?? (ethNetwork === 'mainnet' ? DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET : DEFAULT_COLLECTIONS_SUBGRAPH_ROPSTEN)
  const maticCollectionsSubgraphURL: string = await config.getString('COLLECTIONS_L2_SUBGRAPH_URL') ?? (process.env.ETH_NETWORK === 'mainnet' ? DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET : DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MUMBAI)
  const ensSubgraphURL: string = await config.getString('ENS_OWNER_PROVIDER_URL') ?? (process.env.ETH_NETWORK === 'mainnet' ? DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET : DEFAULT_ENS_OWNER_PROVIDER_URL_ROPSTEN)
  // const thirdPartyRegistrySubgraph: string = await config.getString('THIRD_PARTY_REGISTRY_SUBGRAPH_URL') ?? (process.env.ETH_NETWORK === 'mainnet' ? DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET : DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MUMBAI)
  
  const collectionsSubgraph = await createSubgraphComponent(components, collectionsSubgraphURL)
  const maticCollectionsSubgraph = await createSubgraphComponent(components, maticCollectionsSubgraphURL)
  const ensSubgraph = await createSubgraphComponent(components, ensSubgraphURL)
  // const urls = { maticCollectionsSubgraph, ensSubgraph, thirdPartyRegistrySubgraph}

  async function start() {}
      
  async function stop() {}

  /**
   * This method returns the third party resolver API to be used to query assets from any collection
   * of given third party integration
   */
  // async function findThirdPartyResolver(subgraph: ISubgraphComponent, id: string): Promise<string | undefined> {
  //   const query: Query<{ thirdParties: [{ resolver: string }] }, string | undefined> = {
  //     description: 'fetch third party resolver',
  //     subgraph: subgraph,
  //     query: QUERY_THIRD_PARTY_RESOLVER,
  //     mapper: (response) => response.thirdParties[0]?.resolver
  //   }
  //   return await runQuery(query, { id })
  // }
    
  return {
    start,
    stop,
    collectionsSubgraph,
    maticCollectionsSubgraph,
    ensSubgraph
  }
}
