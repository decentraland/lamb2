import { AppComponents, Item } from '../../types'
import { fetchAllNFTs, THE_GRAPH_PAGE_SIZE } from './fetch-elements'
import { compareByRarity } from '../utils'

function groupItemsByURN(items: ItemFromQuery[]): Item[] {
  const itemsByURN = new Map<string, Item>()

  items.forEach((item) => {
    const individualData = {
      id: item.id,
      tokenId: item.tokenId,
      transferredAt: item.transferredAt,
      price: item.item.price
    }
    if (itemsByURN.has(item.urn)) {
      const itemFromMap = itemsByURN.get(item.urn)!
      itemFromMap.individualData.push(individualData)
      itemFromMap.amount = itemFromMap.amount + 1
    } else {
      itemsByURN.set(item.urn, {
        urn: item.urn,
        individualData: [individualData],
        rarity: item.item.rarity,
        amount: 1
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
      category
      transferredAt,
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

export type ItemFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  item: {
    rarity: string
    price: number
  }
}

export async function fetchAllEmotes(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const emotes = await fetchAllNFTs<ItemFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['emote'],
    owner
  )
  return groupItemsByURN(emotes).sort(compareByRarity)
}

export async function fetchAllWearables(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const ethereumWearables = await fetchAllNFTs<ItemFromQuery>(
    components.theGraph.ethereumCollectionsSubgraph,
    QUERIES['wearable'],
    owner
  )
  const maticWearables = await fetchAllNFTs<ItemFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['wearable'],
    owner
  )
  return groupItemsByURN(ethereumWearables.concat(maticWearables)).sort(compareByRarity)
}
