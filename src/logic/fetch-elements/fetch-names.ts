import { AppComponents, Name } from '../../types'
import { fetchAllNFTs, THE_GRAPH_PAGE_SIZE } from './fetch-elements'
import {
  MarketplaceApiFetcher,
  MarketplaceApiError,
  MarketplaceApiParams
} from '../../adapters/marketplace-api-fetcher'
import { ElementsFilters } from '../../adapters/elements-fetcher'
import { buildMarketplaceApiParams } from './fetch-items'

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

export async function fetchAllNames(
  components: Pick<AppComponents, 'theGraph' | 'logs'> & { marketplaceApiFetcher?: MarketplaceApiFetcher },
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: Name[]; totalAmount: number }> {
  const { marketplaceApiFetcher, logs } = components

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  // Try marketplace API first if available
  if (marketplaceApiFetcher) {
    const logger = logs.getLogger('fetch-names')
    try {
      logger.debug(`Attempting to fetch names for ${owner} from marketplace API`)

      const { names, total } = await marketplaceApiFetcher.fetchUserNames(owner, apiParams)

      logger.debug(`Successfully fetched ${names.length} names for ${owner} from marketplace API`)
      return {
        elements: names,
        totalAmount: total || names.length
      }
    } catch (error) {
      if (error instanceof MarketplaceApiError) {
        logger.warn(`Marketplace API failed for names ${owner}, falling back to The Graph`, { error: error.message })
      } else {
        logger.error(`Unexpected error with marketplace API for names ${owner}, falling back to The Graph`, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
      // Continue to The Graph fallback below
    }
  }

  // Original The Graph implementation (fallback or primary if no marketplace API)
  const elements = (
    await fetchAllNFTs<NameFromQuery>(components.theGraph.ensSubgraph, QUERY_NAMES_PAGINATED, owner)
  ).map((n) => {
    const { name, contractAddress, tokenId, activeOrder } = n
    return {
      name,
      contractAddress,
      tokenId,
      price: activeOrder ? activeOrder.price : undefined
    }
  })

  return { elements, totalAmount: elements.length }
}
