import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits, Emote } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { compareByRarity } from '../logic/utils'

const THE_GRAPH_PAGE_SIZE = 1000

// TODO cache metrics

export enum EmotesFetcherErrorCode {
  CANNOT_FETCH_EMOTES
}

export class EmotesFetcherError extends Error {
  constructor(public code: EmotesFetcherErrorCode, message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export type EmotesResult = {
  emotes: Emote[]
  totalAmount: number
}

export type EmotesFetcher = IBaseComponent & {
  // NOTE: the result will be always orderer by rarity
  fetchByOwner(address: string, limits: Limits): Promise<EmotesResult>
}

type EmotesQueryResponse = {
  nfts: EmoteFromQuery[]
}

type EmoteFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  item: {
    rarity: string
    price: number
  }
}

const QUERY_EMOTES: string = `
  query fetchEmotesByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "emote"},
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

function groupEmotesByURN(emotes: EmoteFromQuery[]): Emote[] {
  const emotesByURN = new Map<string, Emote>()

  emotes.forEach((emote) => {
    const individualData = {
      id: emote.id,
      tokenId: emote.tokenId,
      transferredAt: emote.transferredAt,
      price: emote.item.price
    }
    if (emotesByURN.has(emote.urn)) {
      const emoteFromMap = emotesByURN.get(emote.urn)!
      emoteFromMap.individualData.push(individualData)
      emoteFromMap.amount = emoteFromMap.amount + 1
    } else {
      emotesByURN.set(emote.urn, {
        urn: emote.urn,
        individualData: [individualData],
        rarity: emote.item.rarity,
        amount: 1
      })
    }
  })

  return Array.from(emotesByURN.values())
}

async function runEmotesQuery(subgraph: ISubgraphComponent, address: string): Promise<EmoteFromQuery[]> {
  const emotes = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: EmotesQueryResponse
  do {
    result = await subgraph.query<EmotesQueryResponse>(QUERY_EMOTES, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      emotes.push(nft)
    }

    idFrom = emotes[emotes.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return emotes
}

export async function createEmotesFetcherComponent({
  config,
  theGraph,
  logs
}: Pick<AppComponents, 'logs' | 'config' | 'theGraph'>): Promise<EmotesFetcher> {
  const emotesSize = (await config.getNumber('EMOTES_CACHE_MAX_SIZE')) ?? 1000
  const emotesAge = (await config.getNumber('EMOTES_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default
  const logger = logs.getLogger('emotes-fetcher')

  const cache = new LRU<string, Emote[]>({
    max: emotesSize,
    ttl: emotesAge,
    fetchMethod: async function (address: string, staleValue: Emote[]) {
      try {
        // TODO: Remove ethereum emotes as there are no emotes in Ethereum
        const [ethereumEmotes, maticEmotes] = await Promise.all([
          runEmotesQuery(theGraph.ethereumCollectionsSubgraph, address),
          runEmotesQuery(theGraph.maticCollectionsSubgraph, address)
        ])

        return groupEmotesByURN(ethereumEmotes.concat(maticEmotes)).sort(compareByRarity)
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<EmotesResult> {
    const results = await cache.fetch(address)
    if (results === undefined) {
      throw new EmotesFetcherError(EmotesFetcherErrorCode.CANNOT_FETCH_EMOTES, `Cannot fetch emotes for ${address}`)
    }
    const totalAmount = results.length
    return {
      emotes: results.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}
