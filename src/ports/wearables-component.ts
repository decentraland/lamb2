import { AppComponents, CachedWearable } from '../types'
import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { runQuery } from './the-graph'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'

const THE_GRAPH_PAGE_SIZE = 1000

export type WearablesComponent = IBaseComponent & {
  fetchByOwner: (owner: string) => Promise<CachedWearable[]>
}

function compareByTransferredAt(wearable1: CachedWearable, wearable2: CachedWearable) {
  if (
    wearable1.individualData &&
    wearable1.individualData[0].transferredAt &&
    wearable2.individualData &&
    wearable2.individualData[0].transferredAt
  )
    return wearable2.individualData[0].transferredAt - wearable1.individualData[0].transferredAt
  else return 0
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

type WearablesQueryResponse = {
  nfts: WearableFromQuery[]
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

async function runWearablesQuery(subgraph: ISubgraphComponent, owner: string) {
  const nfts = []

  owner = owner.toLowerCase()
  let idFrom = ''
  let result: WearablesQueryResponse
  do {
    result = await runQuery<WearablesQueryResponse>(subgraph, QUERY_WEARABLES, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      nfts.push(nft)
    }

    idFrom = nfts[nfts.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return nfts
}

export async function createWearablesComponent({
  theGraph,
  config,
  logs
}: Pick<AppComponents, 'config' | 'logs' | 'theGraph'>): Promise<WearablesComponent> {
  const logger = logs.getLogger('wearables cache')

  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) || 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) || 600000 // 10 minutes by default

  const cache = new LRU<string, CachedWearable[]>({
    max: wearablesSize,
    ttl: wearablesAge,
    fetchMethod: async function (owner: string, _staleValue: CachedWearable[]) {
      // Query owned wearables from TheGraph for the address
      const [ethereumWearables, maticWearables] = await Promise.all([
        runWearablesQuery(theGraph.collectionsSubgraph, owner),
        runWearablesQuery(theGraph.maticCollectionsSubgraph, owner)
      ])

      logger.debug(
        `${ethereumWearables.length} ethereum wearables and ${maticWearables.length} matic wearables retrieved from subgraph`
      )

      const wearablesByURN = new Map<string, CachedWearable>()

      function processWearable(wearable: WearableFromQuery) {
        const individualData = {
          id: wearable.id,
          tokenId: wearable.tokenId,
          transferredAt: wearable.transferredAt,
          price: wearable.item.price
        }

        let wearableFromMap = wearablesByURN.get(wearable.urn)
        if (wearableFromMap) {
          wearableFromMap.individualData!.push(individualData)
          wearableFromMap.amount = wearableFromMap.amount + 1
        } else {
          wearableFromMap = {
            urn: wearable.urn,
            individualData: [individualData],
            rarity: wearable.item.rarity,
            amount: 1
          }
          wearablesByURN.set(wearable.urn, wearableFromMap)
        }
      }
      ethereumWearables.forEach(processWearable)
      maticWearables.forEach(processWearable)

      return Array.from(wearablesByURN.values()).sort(compareByTransferredAt)
    }
  })

  async function fetchByOwner(owner: string): Promise<CachedWearable[]> {
    return (await cache.fetch(owner)) || []
  }

  return {
    fetchByOwner
  }
}
