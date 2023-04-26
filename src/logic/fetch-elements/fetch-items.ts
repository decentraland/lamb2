import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { AppComponents, Item } from '../../types'
import { compareByRarity } from '../utils'
import { THE_GRAPH_PAGE_SIZE, fetchAllNFTs } from './fetch-elements'

function isWearable(item: WearableFromQuery | EmoteFromQuery): item is WearableFromQuery {
  return 'wearable' in item.metadata
}

function groupItemsByURN(items: (WearableFromQuery | EmoteFromQuery)[]): Item[] {
  const itemsByURN = new Map<string, Item>()

  items.forEach((itemFromQuery) => {
    const individualData = {
      id: itemFromQuery.id,
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
        name: isWearable(itemFromQuery) ? itemFromQuery.metadata.wearable.name : itemFromQuery.metadata.emote.name,
        category: isWearable(itemFromQuery)
          ? itemFromQuery.metadata.wearable.category
          : itemFromQuery.metadata.emote.category,
        minTransferredAt: itemFromQuery.transferredAt,
        maxTransferredAt: itemFromQuery.transferredAt
      })
    }
  })

  return Array.from(itemsByURN.values())
}

type ItemCategory = 'wearable' | 'emote'

function createQueryForCategory(category: ItemCategory) {
  return `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "${category}"},
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

export async function fetchAllEmotes(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const emotes = await fetchAllNFTs<EmoteFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['emote'],
    owner
  )
  return groupItemsByURN(emotes).sort(compareByRarity)
}

export async function fetchAllWearables(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const ethereumWearables = await fetchAllNFTs<WearableFromQuery>(
    components.theGraph.ethereumCollectionsSubgraph,
    QUERIES['wearable'],
    owner
  )
  const maticWearables = await fetchAllNFTs<WearableFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['wearable'],
    owner
  )
  return groupItemsByURN(ethereumWearables.concat(maticWearables)).sort(compareByRarity)
}
