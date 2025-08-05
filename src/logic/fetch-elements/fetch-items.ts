import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { Item, OnChainEmote, OnChainWearable, Pagination, AppComponents } from '../../types'
import {
  MarketplaceApiParams,
  MarketplaceApiFetcher,
  MarketplaceApiError
} from '../../adapters/marketplace-api-fetcher'
import { ElementsFilters } from '../../adapters/elements-fetcher'
import { THE_GRAPH_PAGE_SIZE, fetchAllNFTs } from './fetch-elements'
import { compareByRarity } from '../sorting'

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

function createQueryForCategory(category: ItemCategory) {
  const itemTypeFilter =
    category === 'wearable' ? `itemType_in: [wearable_v1, wearable_v2, smart_wearable_v1]` : `itemType: emote_v1`
  return `query fetchItemsByOwner($owner: String, $idFrom: ID) {
    nfts(
      where: { id_gt: $idFrom, owner_: {address: $owner}, ${itemTypeFilter}},
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      urn,
      id,
      tokenId,
      category,
      transferredAt,
      metadata {
        ${category} {
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

const QUERIES: Record<ItemCategory, string> = {
  emote: createQueryForCategory('emote'),
  wearable: createQueryForCategory('wearable')
}

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

export async function fetchAllEmotes(
  components: Pick<AppComponents, 'theGraph' | 'logs'> & { marketplaceApiFetcher?: MarketplaceApiFetcher },
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: OnChainEmote[]; totalAmount: number }> {
  const { marketplaceApiFetcher, logs } = components

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  // Try marketplace API first if available
  if (marketplaceApiFetcher) {
    const logger = logs.getLogger('fetch-emotes')
    try {
      logger.debug(`Attempting to fetch emotes for ${owner} from marketplace API`)

      const { emotes, total } = await marketplaceApiFetcher.fetchUserEmotes(owner, apiParams)
      const sortedEmotes = emotes.sort(compareByRarity)

      logger.debug(`Successfully fetched ${sortedEmotes.length} emotes for ${owner} from marketplace API`)
      return {
        elements: sortedEmotes,
        totalAmount: total || sortedEmotes.length
      }
    } catch (error) {
      if (error instanceof MarketplaceApiError) {
        logger.warn(`Marketplace API failed for emotes ${owner}, falling back to The Graph`, {
          error: error.message
        })
      } else {
        logger.error(`Unexpected error with marketplace API for emotes ${owner}, falling back to The Graph`, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
      // Continue to The Graph fallback below
    }
  }

  // There are no emotes on Ethereum, only on Polygon
  const emotes = await fetchAllNFTs<EmoteFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['emote'],
    owner
  )

  const emotesGrouped = groupItemsByURN(emotes, (item) => item.metadata.emote)

  return { elements: emotesGrouped, totalAmount: emotesGrouped.length }
}

export async function fetchAllWearables(
  components: Pick<AppComponents, 'theGraph' | 'logs'> & { marketplaceApiFetcher?: MarketplaceApiFetcher },
  owner: string,
  pagination?: { pageSize: number; pageNum: number },
  filters?: ElementsFilters
): Promise<{ elements: OnChainWearable[]; totalAmount: number }> {
  const { marketplaceApiFetcher, logs } = components

  // Build marketplace API params from filters if available, otherwise just pagination
  const apiParams: MarketplaceApiParams | undefined =
    filters || pagination ? buildMarketplaceApiParams(filters, pagination) : undefined

  // Try marketplace API first if available
  if (marketplaceApiFetcher) {
    const logger = logs.getLogger('fetch-wearables')
    try {
      logger.debug(`Attempting to fetch wearables for ${owner} from marketplace API`)
      const { wearables, total } = await marketplaceApiFetcher.fetchUserWearables(owner, apiParams)
      const sortedWearables = wearables.sort(compareByRarity)

      logger.debug(`Successfully fetched ${sortedWearables.length} wearables for ${owner} from marketplace API`)
      return {
        elements: sortedWearables,
        totalAmount: total || sortedWearables.length
      }
    } catch (error) {
      if (error instanceof MarketplaceApiError) {
        logger.warn(`Marketplace API failed for wearables ${owner}, falling back to The Graph`, {
          error: error.message
        })
      } else {
        logger.error(`Unexpected error with marketplace API for wearables ${owner}, falling back to The Graph`, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
      // Continue to The Graph fallback below
    }
  }

  const [ethereumWearables, maticWearables] = await Promise.all([
    fetchAllNFTs<WearableFromQuery>(components.theGraph.ethereumCollectionsSubgraph, QUERIES['wearable'], owner),
    fetchAllNFTs<WearableFromQuery>(components.theGraph.maticCollectionsSubgraph, QUERIES['wearable'], owner)
  ])

  const allWearables = [...ethereumWearables, ...maticWearables]
  const wearables = groupItemsByURN(allWearables, (item) => item.metadata.wearable)

  return { elements: wearables, totalAmount: wearables.length }
}
