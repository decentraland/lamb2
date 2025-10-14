import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { ElementsFilters } from '../../adapters/elements-fetcher'

interface NFT {
  id: string
  [key: string]: any
}

interface QueryResults<T> {
  nfts: T[]
}

/**
 * Build GraphQL filters from ElementsFilters
 */
function buildGraphFilters(filters?: ElementsFilters): string {
  const conditions: string[] = []

  if (filters?.category) {
    conditions.push(`category: "${filters.category}"`)
  }

  // Note: The Graph doesn't support name search or rarity filtering directly
  // These would need to be handled client-side after fetching

  return conditions.length > 0 ? `, ${conditions.join(', ')}` : ''
}

/**
 * Build GraphQL orderBy from ElementsFilters
 */
function buildGraphOrderBy(filters?: ElementsFilters): { orderBy: string; orderDirection: string } {
  if (filters?.orderBy) {
    switch (filters.orderBy) {
      case 'date':
        return { orderBy: 'transferredAt', orderDirection: filters.direction || 'DESC' }
      case 'name':
        return { orderBy: 'metadata__name', orderDirection: filters.direction || 'ASC' }
      case 'rarity':
        // The Graph doesn't support rarity sorting directly, fall back to id
        return { orderBy: 'id', orderDirection: 'asc' }
      default:
        return { orderBy: 'id', orderDirection: 'asc' }
    }
  }

  // Default sorting
  return { orderBy: 'id', orderDirection: 'asc' }
}

/**
 * Enhanced fetchAllNFTs with pagination and filtering support
 */
export async function fetchNFTsPaginated<E extends NFT>(
  subgraph: ISubgraphComponent,
  baseQuery: (filters: string, orderBy: string, orderDirection: string, first: number) => string,
  address: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: E[]; totalAmount: number }> {
  const owner = address.toLowerCase()
  const graphFilters = buildGraphFilters(filters)
  const { orderBy, orderDirection } = buildGraphOrderBy(filters)

  // If no pagination provided, fetch all (original behavior)
  if (!pagination) {
    const elements = await fetchAllNFTsOriginal<E>(
      subgraph,
      baseQuery(graphFilters, orderBy, orderDirection, 1000),
      address
    )
    return { elements, totalAmount: elements.length }
  }

  // Use pagination from The Graph
  const offset = (pagination.pageNum - 1) * pagination.pageSize
  const first = pagination.pageSize

  // For offset-based pagination, we need to fetch elements and skip
  // The Graph doesn't have direct offset support, so we simulate it
  if (offset === 0) {
    // First page - direct fetch
    const query = baseQuery(graphFilters, orderBy, orderDirection, first)
    const result = await subgraph.query<QueryResults<E>>(query, { owner })

    return {
      elements: result?.nfts || [],
      totalAmount: result?.nfts?.length || 0 // Note: This is not the real total, but works for basic pagination
    }
  } else {
    // For subsequent pages, we need to fetch more and slice
    // This is not optimal but works with The Graph's cursor-based pagination
    const totalNeeded = offset + first
    const elements = await fetchAllNFTsUpTo<E>(
      subgraph,
      baseQuery(graphFilters, orderBy, orderDirection, 1000),
      address,
      totalNeeded
    )

    return {
      elements: elements.slice(offset, offset + first),
      totalAmount: elements.length
    }
  }
}

/**
 * Original fetchAllNFTs implementation (fetch everything)
 */
async function fetchAllNFTsOriginal<E extends NFT>(
  subgraph: ISubgraphComponent,
  query: string,
  address: string
): Promise<E[]> {
  const elements: E[] = []
  const owner = address.toLowerCase()
  let idFrom: string = ''
  let result: QueryResults<E>

  do {
    result = await subgraph.query<QueryResults<E>>(query, {
      owner,
      idFrom
    })

    if (!result?.nfts || result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      elements.push(nft)
    }

    const idFromLastElement = elements[elements.length - 1].id
    if (!idFromLastElement) {
      throw new Error('Error getting id from last entity from previous page')
    }

    idFrom = idFromLastElement
  } while (result?.nfts?.length === 1000)

  return elements
}

/**
 * Fetch NFTs up to a certain limit (for pagination simulation)
 */
async function fetchAllNFTsUpTo<E extends NFT>(
  subgraph: ISubgraphComponent,
  query: string,
  address: string,
  maxElements: number
): Promise<E[]> {
  const elements: E[] = []
  const owner = address.toLowerCase()
  let idFrom: string = ''
  let result: QueryResults<E>

  do {
    result = await subgraph.query<QueryResults<E>>(query, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      elements.push(nft)
      if (elements.length >= maxElements) {
        return elements
      }
    }

    const idFromLastElement = elements[elements.length - 1].id
    if (!idFromLastElement) {
      throw new Error('Error getting id from last entity from previous page')
    }

    idFrom = idFromLastElement
  } while (result.nfts.length === 1000 && elements.length < maxElements)

  return elements
}

/**
 * Creates a query builder for items (wearables/emotes)
 */
export function createItemQueryBuilder(category: 'wearable' | 'emote' | 'smartWearable') {
  let itemTypeFilter: string

  if (category === 'smartWearable') {
    itemTypeFilter = `itemType: smart_wearable_v1`
  } else if (category === 'emote') {
    itemTypeFilter = `itemType: emote_v1`
  } else if (category === 'wearable') {
    itemTypeFilter = `itemType_in: [wearable_v1, wearable_v2, smart_wearable_v1]`
  }

  return (filters: string, orderBy: string, orderDirection: string, first: number) => `
    query fetchItemsByOwner($owner: String, $idFrom: ID) {
      nfts(
        where: { id_gt: $idFrom, owner_: {address: $owner}, ${itemTypeFilter}${filters}},
        orderBy: ${orderBy},
        orderDirection: ${orderDirection},
        first: ${first}
      ) {
        urn,
        id,
        tokenId,
        category,
        transferredAt,
        metadata {
          ${['wearable', 'smartWearable'].includes(category) ? 'wearable' : category} {
            name,
            category
          }
        },
        item {
          rarity,
          price
        }
      }
    }`
}
