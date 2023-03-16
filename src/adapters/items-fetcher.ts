import LRU from 'lru-cache'
import { AppComponents, Limits, ItemsResult, Item, ItemFetcher, ItemFetcherError, ItemFetcherErrorCode } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { compareByRarity } from '../logic/utils'

const THE_GRAPH_PAGE_SIZE = 1000

// TODO cache metrics
type ItemsQueryResponse = {
  nfts: ItemFromQuery[]
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

const QUERIES: Record<ItemCategory, string> = {
  emote: createQueryForCategory('emote'),
  wearable: createQueryForCategory('wearable')
}

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

async function runItemsQuery(
  subgraph: ISubgraphComponent,
  address: string,
  category: ItemCategory
): Promise<ItemFromQuery[]> {
  const items = []
  const owner = address.toLowerCase()
  let idFrom = ''
  let result: ItemsQueryResponse
  const query = QUERIES[category]
  do {
    result = await subgraph.query<ItemsQueryResponse>(query, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      items.push(nft)
    }

    idFrom = items[items.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return items
}

export async function createWearableFetcherComponent(components: Pick<AppComponents, 'logs' | 'config' | 'theGraph'>) {
  return createItemFetcherComponent(components, 'wearable', true)
}

export async function createEmoteFetcherComponent(components: Pick<AppComponents, 'logs' | 'config' | 'theGraph'>) {
  return createItemFetcherComponent(components, 'emote', false)
}

async function createItemFetcherComponent(
  { config, theGraph, logs }: Pick<AppComponents, 'logs' | 'config' | 'theGraph'>,
  category: ItemCategory,
  includeEthereum: boolean
): Promise<ItemFetcher> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 1000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default
  const logger = logs.getLogger(`${category}-fetcher`)

  const cache = new LRU<string, Item[]>({
    max: itemsSize,
    ttl: itemsAge,
    fetchMethod: async function (address: string, staleValue: Item[]) {
      try {
        const [ethereumItems, maticItems] = await Promise.all([
          includeEthereum
            ? runItemsQuery(theGraph.ethereumCollectionsSubgraph, address, category)
            : ([] as ItemFromQuery[]),
          runItemsQuery(theGraph.maticCollectionsSubgraph, address, category)
        ])

        return groupItemsByURN(ethereumItems.concat(maticItems)).sort(compareByRarity)
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<ItemsResult> {
    const results = await cache.fetch(address)
    if (results === undefined) {
      throw new ItemFetcherError(ItemFetcherErrorCode.CANNOT_FETCH_ITEMS, `Cannot fetch ${category}s for ${address}`)
    }
    const totalAmount = results.length
    return {
      items: results.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}
