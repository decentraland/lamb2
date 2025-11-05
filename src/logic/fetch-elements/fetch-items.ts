import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { Item, OnChainEmote, OnChainWearable, Pagination } from '../../types'
import { MarketplaceApiParams } from '../../adapters/marketplace-api-fetcher'
import { ElementsFilters, ElementsFetcherDependencies, ItemType } from '../../adapters/elements-fetcher'

import { fetchNFTsPaginated, createItemQueryBuilder } from './graph-pagination'
import { compareByRarity } from '../sorting'
import { fetchWithMarketplaceFallback } from '../api-with-fallback'

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
      const { emotes, total } = await marketplaceApiFetcher!.fetchUserEmotes(owner, apiParams)
      const sortedEmotes = emotes.sort(compareByRarity)

      return {
        elements: sortedEmotes,
        totalAmount: total || sortedEmotes.length
      }
    },
    async () => {
      // TheGraph fallback implementation
      // There are no emotes on Ethereum, only on Polygon
      const emoteQueryBuilder = createItemQueryBuilder('emote')

      const maticResult = await fetchNFTsPaginated<EmoteFromQuery>(
        theGraph.maticCollectionsSubgraph,
        emoteQueryBuilder,
        owner,
        pagination,
        filters
      )

      const emotesGrouped = groupItemsByURN(maticResult.elements, (item) => item.metadata.emote)

      return {
        elements: emotesGrouped,
        totalAmount: maticResult.totalAmount
      }
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
      const { wearables, total } = await marketplaceApiFetcher!.fetchUserWearables(owner, apiParams)
      const sortedWearables = wearables.sort(compareByRarity)

      return {
        elements: sortedWearables,
        totalAmount: total || sortedWearables.length
      }
    },
    async () => {
      // TheGraph fallback implementation
      const itemType = (filters?.itemType || 'wearable') as ItemType
      const network = filters?.network

      // Determine which subgraphs to query based on network filter
      const shouldQueryEthereum = !network || network === 'ethereum'
      const shouldQueryMatic = !network || network === 'polygon'

      const wearableQueryBuilder = createItemQueryBuilder(itemType, network)

      const [ethereumResult, maticResult] = await Promise.all([
        shouldQueryEthereum
          ? fetchNFTsPaginated<WearableFromQuery>(
              theGraph.ethereumCollectionsSubgraph,
              wearableQueryBuilder,
              owner,
              pagination,
              filters
            )
          : Promise.resolve({ elements: [], totalAmount: 0 }),
        shouldQueryMatic
          ? fetchNFTsPaginated<WearableFromQuery>(
              theGraph.maticCollectionsSubgraph,
              wearableQueryBuilder,
              owner,
              pagination,
              filters
            )
          : Promise.resolve({ elements: [], totalAmount: 0 })
      ])

      const allWearables = [...ethereumResult.elements, ...maticResult.elements]
      const wearables = groupItemsByURN(allWearables, (item) => item.metadata.wearable)

      return {
        elements: wearables,
        totalAmount: ethereumResult.totalAmount + maticResult.totalAmount
      }
    }
  )
}
