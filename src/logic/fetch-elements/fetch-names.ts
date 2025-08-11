import { Name } from '../../types'
import { fetchAllNFTs, THE_GRAPH_PAGE_SIZE } from './fetch-elements'
import { MarketplaceApiParams } from '../../adapters/marketplace-api-fetcher'
import { ElementsFilters, ElementsFetcherDependencies } from '../../adapters/elements-fetcher'
import { buildMarketplaceApiParams } from './fetch-items'
import { fetchWithMarketplaceFallback } from '../api-with-fallback'

const QUERY_NAMES_PAGINATED: string = `
  query fetchNamesByOwner($owner: String, $idFrom: ID) {
    nfts(
      where: {owner_: {address: $owner}, category: ens, id_gt: $idFrom }
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      id,
      name,
      contractAddress,
      tokenId,
      activeOrder {
        price
      }
    }
}`

export type NameFromQuery = {
  id: string
  name: string
  contractAddress: string
  tokenId: string
  activeOrder?: {
    price: number
  }
}

export async function fetchNames(
  dependencies: ElementsFetcherDependencies,
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: Name[]; totalAmount: number }> {
  const { marketplaceApiFetcher, theGraph, logs } = dependencies

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  return fetchWithMarketplaceFallback(
    { marketplaceApiFetcher, theGraph, logs },
    'names',
    async () => {
      const { names, total } = await marketplaceApiFetcher!.fetchUserNames(owner, apiParams)
      return {
        elements: names,
        totalAmount: total || names.length
      }
    },
    async () => {
      // TheGraph fallback implementation
      const elements = (await fetchAllNFTs<NameFromQuery>(theGraph.ensSubgraph, QUERY_NAMES_PAGINATED, owner)).map(
        (n) => {
          const { name, contractAddress, tokenId, activeOrder } = n
          return {
            name,
            contractAddress,
            tokenId,
            price: activeOrder ? activeOrder.price : undefined
          }
        }
      )

      return { elements, totalAmount: elements.length }
    }
  )
}
