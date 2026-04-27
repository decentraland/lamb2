import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { TheGraphComponent } from '../../ports/the-graph'
import { parseUrn } from '../utils'

const WEARABLE_ITEM_TYPES = ['wearable_v1', 'wearable_v2', 'smart_wearable_v1']
const EMOTE_ITEM_TYPES = ['emote_v1']
const L1_NETWORKS = new Set(['mainnet', 'sepolia', 'ropsten', 'kovan', 'rinkeby', 'goerli'])
const L2_NETWORKS = new Set(['matic', 'mumbai', 'amoy'])

export type ItemsByFiltersCriteria = {
  collectionIds?: string[]
  itemIds?: string[]
  textSearch?: string
}

export type ItemsByFiltersPagination = {
  limit: number
  lastId?: string
}

export async function fetchWearablesByFilters(
  theGraph: TheGraphComponent,
  filters: ItemsByFiltersCriteria,
  pagination: ItemsByFiltersPagination
): Promise<string[]> {
  return fetchItemsByFilters(theGraph, WEARABLE_ITEM_TYPES, filters, pagination, { queryL1: true })
}

// emotes only exist on l2, so the l1 collection subgraph is skipped entirely.
export async function fetchEmotesByFilters(
  theGraph: TheGraphComponent,
  filters: ItemsByFiltersCriteria,
  pagination: ItemsByFiltersPagination
): Promise<string[]> {
  return fetchItemsByFilters(theGraph, EMOTE_ITEM_TYPES, filters, pagination, { queryL1: false })
}

async function fetchItemsByFilters(
  theGraph: TheGraphComponent,
  itemTypes: string[],
  filters: ItemsByFiltersCriteria,
  pagination: ItemsByFiltersPagination,
  options: { queryL1: boolean }
): Promise<string[]> {
  let remaining = pagination.limit
  let cursor = pagination.lastId
  let cursorLayer = cursor ? await getProtocol(cursor) : undefined

  const urns: string[] = []

  if (options.queryL1 && remaining > 0 && (!cursorLayer || L1_NETWORKS.has(cursorLayer))) {
    const l1 = await runFilterQuery(theGraph.ethereumCollectionsSubgraph, itemTypes, filters, remaining, cursor)
    urns.push(...l1)
    if (l1.length > 0) {
      remaining -= l1.length
      cursor = undefined
      cursorLayer = undefined
    }
  }

  if (remaining > 0 && (!cursorLayer || L2_NETWORKS.has(cursorLayer))) {
    const l2 = await runFilterQuery(theGraph.maticCollectionsSubgraph, itemTypes, filters, remaining, cursor)
    urns.push(...l2)
  }

  return urns
}

async function getProtocol(urn: string): Promise<string | undefined> {
  const parsed = await parseUrn(urn)
  return parsed?.type === 'blockchain-collection-v1-asset' || parsed?.type === 'blockchain-collection-v2-asset'
    ? parsed.network
    : undefined
}

async function runFilterQuery(
  subgraph: ISubgraphComponent,
  itemTypes: string[],
  filters: ItemsByFiltersCriteria,
  first: number,
  lastId: string | undefined
): Promise<string[]> {
  const query = buildFilterQuery(itemTypes, filters)
  const variables: Record<string, string | number | boolean | string[] | undefined> = {
    first,
    lastId: lastId ?? ''
  }
  if (filters.textSearch) {
    variables.textSearch = filters.textSearch
  }
  if (filters.itemIds) {
    variables.ids = filters.itemIds
  }
  if (filters.collectionIds) {
    variables.collectionIds = filters.collectionIds
  }

  const response = await subgraph.query<{ collections?: { items: { urn: string }[] }[]; items?: { urn: string }[] }>(
    query,
    variables
  )

  if (filters.collectionIds) {
    return (response.collections ?? []).flatMap(({ items }) => items.map(({ urn }) => urn))
  }
  return (response.items ?? []).map(({ urn }) => urn)
}

function buildFilterQuery(itemTypes: string[], filters: ItemsByFiltersCriteria): string {
  const whereClause: string[] = [`searchItemType_in: ${JSON.stringify(itemTypes)}`]
  const params: string[] = ['$first: Int!', '$lastId: String!']
  whereClause.push(`urn_gt: $lastId`)
  if (filters.textSearch) {
    params.push('$textSearch: String')
    whereClause.push(`searchText_contains: $textSearch`)
  }
  if (filters.itemIds) {
    params.push('$ids: [String]!')
    whereClause.push(`urn_in: $ids`)
  }

  const itemsQuery = `
    items(where: {${whereClause.join(',')}}, first: $first, orderBy: urn, orderDirection: asc) {
      urn
    }`

  if (filters.collectionIds) {
    params.push('$collectionIds: [String]!')
    return `query ItemsByFilters(${params.join(',')}) {
      collections(where: { urn_in: $collectionIds }, first: 1000, orderBy: urn, orderDirection: asc) {
        ${itemsQuery}
      }
    }`
  }
  return `query ItemsByFilters(${params.join(',')}) {
    ${itemsQuery}
  }`
}
