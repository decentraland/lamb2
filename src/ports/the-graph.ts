import { IBaseComponent } from '@well-known-components/interfaces'
import { ISubgraphComponent, createSubgraphComponent } from '@well-known-components/thegraph-component'
import { AppComponents } from '../types'

export type TheGraphComponent = IBaseComponent & {
  ethereumCollectionsSubgraph: ISubgraphComponent
  maticCollectionsSubgraph: ISubgraphComponent
  ensSubgraph: ISubgraphComponent
  thirdPartyRegistrySubgraph: ISubgraphComponent
  landSubgraph: ISubgraphComponent
}

const DEFAULT_COLLECTIONS_SUBGRAPH_SEPOLIA =
  'https://api.studio.thegraph.com/query/49472/collections-ethereum-sepolia/version/latest'
const DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET = 'https://subgraph.decentraland.org/collections-ethereum-mainnet'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_AMOY = 'https://subgraph.decentraland.org/collections-matic-amoy'
const DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET = 'https://subgraph.decentraland.org/collections-matic-mainnet'
const DEFAULT_ENS_OWNER_PROVIDER_URL_SEPOLIA =
  'https://api.studio.thegraph.com/query/49472/marketplace-sepolia/version/latest'
const DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET = 'https://subgraph.decentraland.org/marketplace'
const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_AMOY = 'https://subgraph.decentraland.org/tpr-matic-amoy'
const DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET = 'https://subgraph.decentraland.org/tpr-matic-mainnet'
const DEFAULT_LAND_SUBGRAPH_SEPOLIA = 'https://api.studio.thegraph.com/query/49472/land-manager-sepolia/version/latest'
const DEFAULT_LAND_SUBGRAPH_MATIC_MAINNET = 'https://subgraph.decentraland.org/land-manager'

export async function createTheGraphComponent(
  components: Pick<AppComponents, 'config' | 'logs' | 'fetch' | 'metrics'>
): Promise<TheGraphComponent> {
  const { config } = components

  const ethNetwork = await config.getString('ETH_NETWORK')
  const ethereumCollectionsSubgraphURL: string =
    (await config.getString('COLLECTIONS_L1_SUBGRAPH_URL')) ??
    (ethNetwork === 'mainnet' ? DEFAULT_COLLECTIONS_SUBGRAPH_MAINNET : DEFAULT_COLLECTIONS_SUBGRAPH_SEPOLIA)
  const maticCollectionsSubgraphURL: string =
    (await config.getString('COLLECTIONS_L2_SUBGRAPH_URL')) ??
    (process.env.ETH_NETWORK === 'mainnet'
      ? DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_MAINNET
      : DEFAULT_COLLECTIONS_SUBGRAPH_MATIC_AMOY)
  const ensSubgraphURL: string =
    (await config.getString('ENS_OWNER_PROVIDER_URL')) ??
    (ethNetwork === 'mainnet' ? DEFAULT_ENS_OWNER_PROVIDER_URL_MAINNET : DEFAULT_ENS_OWNER_PROVIDER_URL_SEPOLIA)
  const thirdPartyRegistrySubgraphURL: string =
    (await config.getString('THIRD_PARTY_REGISTRY_SUBGRAPH_URL')) ??
    (ethNetwork === 'mainnet'
      ? DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_MAINNET
      : DEFAULT_THIRD_PARTY_REGISTRY_SUBGRAPH_MATIC_AMOY)
  const landSubgraphURL: string =
    (await config.getString('LAND_SUBGRAPH_URL')) ??
    (ethNetwork === 'mainnet' ? DEFAULT_LAND_SUBGRAPH_MATIC_MAINNET : DEFAULT_LAND_SUBGRAPH_SEPOLIA)

  const ethereumCollectionsSubgraph = await createSubgraphComponent(components, ethereumCollectionsSubgraphURL)
  const maticCollectionsSubgraph = await createSubgraphComponent(components, maticCollectionsSubgraphURL)
  const ensSubgraph = await createSubgraphComponent(components, ensSubgraphURL)
  const thirdPartyRegistrySubgraph = await createSubgraphComponent(components, thirdPartyRegistrySubgraphURL)
  const landSubgraph = await createSubgraphComponent(components, landSubgraphURL)

  return {
    ethereumCollectionsSubgraph,
    maticCollectionsSubgraph,
    ensSubgraph,
    thirdPartyRegistrySubgraph,
    landSubgraph
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
