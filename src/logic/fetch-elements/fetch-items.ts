import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { AppComponents, Item, OnChainEmote, OnChainWearable } from '../../types'
import { compareByRarity } from '../sorting'
import { THE_GRAPH_PAGE_SIZE, fetchAllNFTs } from './fetch-elements'

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

export async function fetchAllEmotes(
  components: Pick<AppComponents, 'theGraph'>,
  owner: string
): Promise<OnChainEmote[]> {
  const emotes = await fetchAllNFTs<EmoteFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['emote'],
    owner
  )
  return groupItemsByURN<EmoteFromQuery, EmoteFromQuery['metadata']['emote']>(
    emotes,
    (emote) => emote.metadata.emote
  ).sort(compareByRarity)
}

export async function fetchAllWearables(
  components: Pick<AppComponents, 'theGraph'>,
  owner: string
): Promise<OnChainWearable[]> {
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
  return groupItemsByURN<WearableFromQuery, WearableFromQuery['metadata']['wearable']>(
    ethereumWearables.concat(maticWearables),
    (wearable) => wearable.metadata.wearable
  ).sort(compareByRarity)
}
