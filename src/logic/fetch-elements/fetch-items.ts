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
      transferredAt: String(itemFromQuery.transferredAt),
      price: String(itemFromQuery.item.price)
    }

    if (itemsByURN.has(itemFromQuery.urn)) {
      const itemFromMap = itemsByURN.get(itemFromQuery.urn)!
      itemFromMap.individualData.push(individualData)
      itemFromMap.amount = itemFromMap.amount + 1
      itemFromMap.minTransferredAt = Math.min(Number(itemFromQuery.transferredAt), itemFromMap.minTransferredAt)
      itemFromMap.maxTransferredAt = Math.max(Number(itemFromQuery.transferredAt), itemFromMap.maxTransferredAt)
    } else {
      itemsByURN.set(itemFromQuery.urn, {
        urn: itemFromQuery.urn,
        individualData: [individualData],
        rarity: itemFromQuery.item.rarity,
        amount: 1,
        name: getMetadata(itemFromQuery).name,
        category: getMetadata(itemFromQuery).category,
        minTransferredAt: Number(itemFromQuery.transferredAt),
        maxTransferredAt: Number(itemFromQuery.transferredAt)
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
  transferredAt: string
  item: {
    rarity: string
    price: string
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
