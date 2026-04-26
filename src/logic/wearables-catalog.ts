import { WearableDefinition } from '@dcl/schemas'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { TheGraphComponent } from '../ports/the-graph'
import { AppComponents, BaseWearable } from '../types'
import { fetchBaseWearables } from './fetch-elements/fetch-base-items'
import { parseUrn } from './utils'

export const BASE_AVATARS_COLLECTION_ID = 'urn:decentraland:off-chain:base-avatars'

const WEARABLE_ITEM_TYPES = ['wearable_v1', 'wearable_v2', 'smart_wearable_v1']
const L1_NETWORKS = new Set(['mainnet', 'sepolia', 'ropsten', 'kovan', 'rinkeby', 'goerli'])
const L2_NETWORKS = new Set(['matic', 'mumbai', 'amoy'])

export type CatalogFilters = {
  collectionIds?: string[]
  itemIds?: string[]
  textSearch?: string
}

export type CatalogPagination = {
  limit: number
  lastId?: string
}

export async function getWearablesCatalog(
  components: Pick<AppComponents, 'theGraph' | 'wearableDefinitionsFetcher' | 'entitiesFetcher'>,
  filters: CatalogFilters,
  pagination: CatalogPagination
): Promise<{ wearables: WearableDefinition[]; lastId: string | undefined }> {
  const { theGraph, wearableDefinitionsFetcher, entitiesFetcher } = components

  let limit = pagination.limit
  let lastId = pagination.lastId

  // Off-chain (base avatars). Skipped when the cursor has already advanced past base avatars,
  // or when the caller filtered to a non-base collection.
  let offChain: WearableDefinition[] = []
  const onlyBaseCollection =
    filters.collectionIds?.length === 1 && filters.collectionIds[0] === BASE_AVATARS_COLLECTION_ID
  const baseCollectionAllowed = !filters.collectionIds || filters.collectionIds.includes(BASE_AVATARS_COLLECTION_ID)

  if (baseCollectionAllowed && (!lastId || isBaseAvatarUrn(lastId))) {
    const baseWearables = await fetchBaseWearables({ entitiesFetcher })
    offChain = filterBaseWearables(baseWearables, filters, lastId)
    limit -= offChain.length
    lastId = undefined
  }

  // On-chain filter query against the L1+L2 collection subgraphs. Skipped when the caller
  // explicitly scoped to base avatars only.
  let onChain: WearableDefinition[] = []
  if (!onlyBaseCollection && limit >= 0) {
    const urns = await findOnChainWearableUrnsByFilters(theGraph, filters, { limit: limit + 1, lastId })
    if (urns.length > 0) {
      const definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(urns)
      onChain = definitions
        .filter((d): d is WearableDefinition => !!d)
        .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
    }
  }

  const merged = [...offChain, ...onChain]
  const hasMore = merged.length > pagination.limit
  const slice = hasMore ? merged.slice(0, pagination.limit) : merged
  return { wearables: slice, lastId: hasMore ? slice[slice.length - 1]?.id : undefined }
}

function isBaseAvatarUrn(urn: string): boolean {
  return urn.toLowerCase().startsWith(BASE_AVATARS_COLLECTION_ID)
}

function filterBaseWearables(
  baseWearables: BaseWearable[],
  filters: CatalogFilters,
  lastId: string | undefined
): WearableDefinition[] {
  return baseWearables
    .filter((wearable) => {
      const lcUrn = wearable.urn.toLowerCase()
      if (lastId && lcUrn <= lastId) {
        return false
      }
      if (filters.itemIds && !filters.itemIds.includes(lcUrn)) {
        return false
      }
      if (filters.textSearch) {
        const englishName = (wearable.entity.metadata as { i18n?: { code: string; text: string }[] })?.i18n?.find(
          (entry) => entry.code === 'en'
        )?.text
        const haystack = (englishName ?? wearable.name).toLowerCase()
        if (!haystack.includes(filters.textSearch)) {
          return false
        }
      }
      return true
    })
    .map((wearable) => wearable.entity.metadata as WearableDefinition)
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
}

async function findOnChainWearableUrnsByFilters(
  theGraph: TheGraphComponent,
  filters: CatalogFilters,
  pagination: { limit: number; lastId?: string }
): Promise<string[]> {
  let remaining = pagination.limit
  let cursor = pagination.lastId
  let cursorLayer = cursor ? await getProtocol(cursor) : undefined

  const urns: string[] = []

  if (remaining > 0 && (!cursorLayer || L1_NETWORKS.has(cursorLayer))) {
    const l1 = await runFilterQuery(theGraph.ethereumCollectionsSubgraph, filters, remaining, cursor)
    urns.push(...l1)
    if (l1.length > 0) {
      remaining -= l1.length
      cursor = undefined
      cursorLayer = undefined
    }
  }

  if (remaining > 0 && (!cursorLayer || L2_NETWORKS.has(cursorLayer))) {
    const l2 = await runFilterQuery(theGraph.maticCollectionsSubgraph, filters, remaining, cursor)
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
  filters: CatalogFilters,
  first: number,
  lastId: string | undefined
): Promise<string[]> {
  const query = buildFilterQuery(filters)
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

function buildFilterQuery(filters: CatalogFilters): string {
  const whereClause: string[] = [`searchItemType_in: ${JSON.stringify(WEARABLE_ITEM_TYPES)}`]
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
    return `query WearablesByFilters(${params.join(',')}) {
      collections(where: { urn_in: $collectionIds }, first: 1000, orderBy: urn, orderDirection: asc) {
        ${itemsQuery}
      }
    }`
  }
  return `query WearablesByFilters(${params.join(',')}) {
    ${itemsQuery}
  }`
}
