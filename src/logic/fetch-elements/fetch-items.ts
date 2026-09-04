import { EmoteCategory, WearableCategory, Network } from '@dcl/schemas'
import {
  HasDate,
  HasName,
  HasRarity,
  InvalidRequestError,
  Item,
  ItemType,
  OnChainEmote,
  OnChainWearable,
  Pagination,
  SortingFunction
} from '../../types'
import { MarketplaceApiParams } from '../../adapters/marketplace-api-fetcher'
import {
  ElementsFilters,
  ElementsFetcherDependencies,
  ItemType as ItemTypeFilter
} from '../../adapters/elements-fetcher'

import { ItemQueryBuilder, createItemQueryBuilder } from './graph-pagination'
import { fetchAllNFTs } from './fetch-elements'
import { selectSortingFunction } from '../sorting'
import { fetchWithMarketplaceFallback } from '../api-with-fallback'
import { ISubgraphComponent } from '@dcl/thegraph-component'

export function buildMarketplaceApiParams(
  filters?: ElementsFilters,
  pagination?: Pick<Pagination, 'pageNum' | 'pageSize'>
): MarketplaceApiParams {
  const params: MarketplaceApiParams = {}

  // Pagination
  if (pagination) {
    params.limit = pagination.pageSize
    params.offset = (pagination.pageNum - 1) * pagination.pageSize
  }

  // Filtering
  if (filters?.category) {
    params.category = filters.category
  }
  if (filters?.rarity) {
    params.rarity = filters.rarity
  }
  if (filters?.name) {
    params.name = filters.name
  }

  // Sorting
  if (filters?.orderBy) {
    params.orderBy = filters.orderBy
  }
  if (filters?.direction) {
    params.direction = filters.direction
  }

  // Item type
  if (filters?.itemType) {
    params.itemType = filters.itemType
  }

  // Network
  if (filters?.network) {
    params.network = filters.network
  }

  return params
}

type SortableItem = HasName & HasRarity & HasDate

/**
 * Maps the requested order onto the in-memory comparators, reusing the same selector the
 * handlers validate against so sort semantics have a single source of truth.
 *
 * Ordering cannot be pushed down to the subgraph: `rarity` follows the rarity scale rather
 * than alphabetical order, and `date` compares the min/max transfer dates that only exist
 * once the rows have been grouped by URN.
 */
function selectSorting<T extends SortableItem>(filters?: ElementsFilters): SortingFunction<T> | undefined {
  if (!filters?.orderBy) {
    return undefined
  }

  const sort = filters.orderBy.toLowerCase()
  // Mirrors `sortDirectionParams`: name ascends by default, everything else descends.
  const direction = (filters.direction ?? (sort === 'name' ? 'asc' : 'desc')).toUpperCase()
  const sorting = selectSortingFunction<T>(sort, direction)

  if (!sorting) {
    throw new InvalidRequestError(
      `Invalid sorting requested: '${sort} ${direction}'. Valid options are '[rarity, name, date] [ASC, DESC]'.`
    )
  }

  return sorting
}

/**
 * Orders the grouped items and cuts out the requested page. `totalAmount` counts the grouped
 * items, so it is the real total rather than the size of the page.
 */
function paginateItems<T extends SortableItem>(
  items: T[],
  pagination?: Pick<Pagination, 'pageNum' | 'pageSize'>,
  filters?: ElementsFilters
): { elements: T[]; totalAmount: number } {
  const sorting = selectSorting<T>(filters)
  // Copied rather than sorted in place: the caller's array is not ours to reorder.
  const ordered = sorting ? [...items].sort(sorting) : items

  if (!pagination) {
    return { elements: ordered, totalAmount: ordered.length }
  }

  const offset = (pagination.pageNum - 1) * pagination.pageSize
  // A page before the first has nothing on it; a negative offset would slice the tail instead.
  if (pagination.pageSize <= 0 || offset < 0) {
    return { elements: [], totalAmount: ordered.length }
  }

  return { elements: ordered.slice(offset, offset + pagination.pageSize), totalAmount: ordered.length }
}

/** Runs the owner query, or resolves to no rows when the filters cannot match anything. */
async function queryOwnedNFTs<E extends { id: string }>(
  subgraph: ISubgraphComponent,
  buildQuery: ItemQueryBuilder,
  owner: string,
  filters?: ElementsFilters
): Promise<E[]> {
  const query = buildQuery(filters)
  return query ? fetchAllNFTs<E>(subgraph, query, owner) : []
}

function groupItemsByURN<
  T extends WearableFromQuery | EmoteFromQuery,
  E extends WearableFromQuery['metadata']['wearable'] | EmoteFromQuery['metadata']['emote']
>(items: T[], getMetadata: (item: T) => E): Item<E['category']>[] {
  const itemsByURN = new Map<string, Item<E['category']>>()

  items.forEach((itemFromQuery) => {
    const individualData = {
      id: itemFromQuery.urn + ':' + itemFromQuery.tokenId,
      tokenId: itemFromQuery.tokenId,
      transferredAt: itemFromQuery.transferredAt,
      price: itemFromQuery.item.price
    }

    if (itemsByURN.has(itemFromQuery.urn)) {
      const itemFromMap = itemsByURN.get(itemFromQuery.urn)!
      itemFromMap.individualData.push(individualData)
      itemFromMap.amount = itemFromMap.amount + 1
      itemFromMap.minTransferredAt = Math.min(itemFromQuery.transferredAt, itemFromMap.minTransferredAt)
      itemFromMap.maxTransferredAt = Math.max(itemFromQuery.transferredAt, itemFromMap.maxTransferredAt)
    } else {
      itemsByURN.set(itemFromQuery.urn, {
        urn: itemFromQuery.urn,
        individualData: [individualData],
        rarity: itemFromQuery.item.rarity,
        itemType: itemFromQuery.itemType,
        amount: 1,
        name: getMetadata(itemFromQuery).name,
        category: getMetadata(itemFromQuery).category,
        minTransferredAt: itemFromQuery.transferredAt,
        maxTransferredAt: itemFromQuery.transferredAt
      })
    }
  })

  return Array.from(itemsByURN.values())
}

type ItemCategory = 'wearable' | 'emote'

type ItemFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  itemType: ItemType
  item: {
    rarity: string
    price: number
  }
  category: ItemCategory
}

export type WearableFromQuery = ItemFromQuery & {
  category: 'wearable'
  metadata: {
    wearable: {
      name: string
      category: WearableCategory
    }
  }
}

export type EmoteFromQuery = ItemFromQuery & {
  category: 'emote'
  metadata: {
    emote: {
      name: string
      category: EmoteCategory
    }
  }
}

export async function fetchEmotes(
  dependencies: ElementsFetcherDependencies,
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: OnChainEmote[]; totalAmount: number }> {
  const { marketplaceApiFetcher, theGraph, logs } = dependencies

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  return fetchWithMarketplaceFallback(
    { marketplaceApiFetcher, theGraph, logs },
    'emotes',
    async () => {
      // Marketplace API handles sorting via orderBy/direction params
      const { emotes, total } = await marketplaceApiFetcher!.fetchUserEmotes(owner, apiParams)

      return {
        elements: emotes,
        totalAmount: total || emotes.length
      }
    },
    async () => {
      // TheGraph fallback implementation
      // There are no emotes on Ethereum, only on Polygon
      const maticResult = await queryOwnedNFTs<EmoteFromQuery>(
        theGraph.maticCollectionsSubgraph,
        createItemQueryBuilder('emote'),
        owner,
        filters
      )

      // Grouping collapses every token of a URN into one item, so it has to happen before the
      // page is cut: a page of rows is not a page of items.
      const emotesGrouped = groupItemsByURN(maticResult, (item) => item.metadata.emote)

      return paginateItems(emotesGrouped, pagination, filters)
    }
  )
}

export async function fetchWearables(
  dependencies: ElementsFetcherDependencies,
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: OnChainWearable[]; totalAmount: number }> {
  const { marketplaceApiFetcher, theGraph, logs } = dependencies

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  return fetchWithMarketplaceFallback(
    { marketplaceApiFetcher, theGraph, logs },
    'wearables',
    async () => {
      // Marketplace API handles sorting via orderBy/direction params
      const { wearables, total } = await marketplaceApiFetcher!.fetchUserWearables(owner, apiParams)

      return {
        elements: wearables,
        totalAmount: total || wearables.length
      }
    },
    async () => {
      // TheGraph fallback implementation
      const itemType = (filters?.itemType || 'wearable') as ItemTypeFilter
      const network = filters?.network

      // Determine which subgraphs to query based on network filter
      const shouldQueryEthereum = !network || network === Network.ETHEREUM
      const shouldQueryMatic = !network || network === Network.MATIC

      const wearableQueryBuilder = createItemQueryBuilder(itemType, network)

      const [ethereumResult, maticResult] = await Promise.all([
        shouldQueryEthereum
          ? queryOwnedNFTs<WearableFromQuery>(
              theGraph.ethereumCollectionsSubgraph,
              wearableQueryBuilder,
              owner,
              filters
            )
          : Promise.resolve([] as WearableFromQuery[]),
        shouldQueryMatic
          ? queryOwnedNFTs<WearableFromQuery>(theGraph.maticCollectionsSubgraph, wearableQueryBuilder, owner, filters)
          : Promise.resolve([] as WearableFromQuery[])
      ])

      // Both networks have to be merged and grouped before the page is cut: paging each
      // subgraph separately would take the same offset from each and concatenate the results.
      const allWearables = [...ethereumResult, ...maticResult]
      const wearables = groupItemsByURN(allWearables, (item) => item.metadata.wearable)

      return paginateItems(wearables, pagination, filters)
    }
  )
}
