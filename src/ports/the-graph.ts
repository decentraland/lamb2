import { IBaseComponent } from '@well-known-components/interfaces'
import { ISubgraphComponent, createSubgraphComponent } from '@well-known-components/thegraph-component'
import { AppComponents } from '../types'

export type TheGraphComponent = IBaseComponent & {
  ethereumCollectionsSubgraph: ISubgraphComponent
  maticCollectionsSubgraph: ISubgraphComponent
  ensSubgraph: ISubgraphComponent
  thirdPartyRegistrySubgraph: ISubgraphComponent
}

const DEFAULT_COLLECTIONS_SUBGRAPH_GOERLI =
  'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-goerli'
const DEFAULT_COLLECTIONS_SUBGRAPH_SEPOLIA =
  'https://api.studio.thegraph.com/query/49472/collections-ethereum-sepolia/version/latest'
const DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET =
  'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-mainnet'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_AMOY = 'https://subgraph.decentraland.org/collections-matic-amoy'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET =
  'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet'
const DEFAULT_ENS_OWNER_PROVIDER_URL_GOERLI = 'https://api.thegraph.com/subgraphs/name/decentraland/marketplace-goerli'
const DEFAULT_ENS_OWNER_PROVIDER_URL_SEPOLIA =
  'https://api.studio.thegraph.com/query/49472/marketplace-sepolia/version/latest'
const DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET = 'https://api.thegraph.com/subgraphs/name/decentraland/marketplace'
const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_AMOY = 'https://subgraph.decentraland.org/tpr-matic-amoy'
const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET =
  'https://api.thegraph.com/subgraphs/name/decentraland/tpr-matic-mainnet'

export async function createTheGraphComponent(
  components: Pick<AppComponents, 'config' | 'logs' | 'fetch' | 'metrics'>
): Promise<TheGraphComponent> {
  const { config } = components

  const ethNetwork = await config.getString('ETH_NETWORK')
  const ethereumCollectionsSubgraphURL: string =
    (await config.getString('COLLECTIONS_L1_SUBGRAPH_URL')) ??
    (ethNetwork === 'mainnet'
      ? DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET
      : ethNetwork === 'sepolia'
        ? DEFAULT_COLLECTIONS_SUBGRAPH_SEPOLIA
        : DEFAULT_COLLECTIONS_SUBGRAPH_GOERLI)
  const maticCollectionsSubgraphURL: string =
    (await config.getString('COLLECTIONS_L2_SUBGRAPH_URL')) ??
    (process.env.ETH_NETWORK === 'mainnet'
      ? DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET
      : DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_AMOY)
  const ensSubgraphURL: string =
    (await config.getString('ENS_OWNER_PROVIDER_URL')) ??
    (ethNetwork === 'mainnet'
      ? DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET
      : ethNetwork === 'sepolia'
        ? DEFAULT_ENS_OWNER_PROVIDER_URL_SEPOLIA
        : DEFAULT_ENS_OWNER_PROVIDER_URL_GOERLI)
  const thirdPartyRegistrySubgraphURL: string =
    (await config.getString('THIRD_PARTY_REGISTRY_SUBGRAPH_URL')) ??
    (ethNetwork === 'mainnet'
      ? DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET
      : DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_AMOY)

  const ethereumCollectionsSubgraph = await createSubgraphComponent(components, ethereumCollectionsSubgraphURL)
  const maticCollectionsSubgraph = await createSubgraphComponent(components, maticCollectionsSubgraphURL)
  const ensSubgraph = await createSubgraphComponent(components, ensSubgraphURL)
  const thirdPartyRegistrySubgraph = await createSubgraphComponent(components, thirdPartyRegistrySubgraphURL)

  return {
    ethereumCollectionsSubgraph,
    maticCollectionsSubgraph,
    ensSubgraph,
    thirdPartyRegistrySubgraph
  }
}

export async function runQuery<QueryResult>(
  subgraph: ISubgraphComponent,
  query: string,
  variables: Record<string, any>
): Promise<QueryResult> {
  // TODO: change the output type
  try {
    return subgraph.query<QueryResult>(query, variables)
  } catch (error) {
    // TheGraphClient.LOGGER.error(
    //   `Failed to execute the following query to the subgraph ${this.urls[query.subgraph]} ${query.description}'.`,
    //   error
    // )
    // TODO: logger
    console.log(error)
    throw new Error('Internal server error')
  }
}
