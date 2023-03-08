import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits, Wearable } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { compareByRarity } from '../logic/utils'

const THE_GRAPH_PAGE_SIZE = 1000

// TODO cache metrics

export type WearablesResult = {
  wearables: Wearable[]
  totalAmount: number
}

export type WearablesFetcher = IBaseComponent & {
  // NOTE: the result will be always orderer by rarity
  fetchByOwner(address: string, limits: Limits): Promise<WearablesResult>
}

type WearablesQueryResponse = {
  nfts: WearableFromQuery[]
}

type WearableFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  item: {
    rarity: string
    price: number
  }
}

const QUERY_WEARABLES: string = `
  query fetchWearablesByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "wearable"},
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

function groupWearablesByURN(wearables: WearableFromQuery[]): Wearable[] {
  const wearablesByURN = new Map<string, Wearable>()

  wearables.forEach((wearable) => {
    const individualData = {
      id: wearable.id,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    if (wearablesByURN.has(wearable.urn)) {
      const wearableFromMap = wearablesByURN.get(wearable.urn)!
      wearableFromMap.individualData.push(individualData)
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      wearablesByURN.set(wearable.urn, {
        urn: wearable.urn,
        individualData: [individualData],
        rarity: wearable.item.rarity,
        amount: 1
      })
    }
  })

  return Array.from(wearablesByURN.values())
}

async function runWearablesQuery(subgraph: ISubgraphComponent, address: string): Promise<WearableFromQuery[]> {
  const wearables = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: WearablesQueryResponse
  do {
    result = await subgraph.query<WearablesQueryResponse>(QUERY_WEARABLES, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      wearables.push(nft)
    }

    idFrom = wearables[wearables.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return wearables
}

export async function createWearablesFetcherComponent({
  config,
  theGraph,
  logs
}: Pick<AppComponents, 'logs' | 'config' | 'theGraph'>): Promise<WearablesFetcher> {
  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) ?? 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default
  const logger = logs.getLogger('wearables-fetcher')

  const cache = new LRU<string, Wearable[]>({
    max: wearablesSize,
    ttl: wearablesAge,
    fetchMethod: async function (address: string, staleValue: Wearable[]) {
      try {
        const [ethereumWearables, maticWearables] = await Promise.all([
          runWearablesQuery(theGraph.ethereumCollectionsSubgraph, address),
          runWearablesQuery(theGraph.maticCollectionsSubgraph, address)
        ])

        return groupWearablesByURN(ethereumWearables.concat(maticWearables)).sort(compareByRarity)
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<WearablesResult> {
    const results = await cache.fetch(address)
    if (!results) {
      // TODO: or should we throw instead?
      return {
        wearables: [],
        totalAmount: 0
      }
    }
    const totalAmount = results.length
    return {
      wearables: results.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}
