import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits, Name } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'

export type NamesResult = {
  names: Name[]
  totalAmount: number
}

export type NamesFetcher = IBaseComponent & {
  fetchByOwner(address: string, limits: Limits): Promise<NamesResult>
}

export enum NamesFetcherErrorCode {
  CANNOT_FETCH_NAMES
}

export class NamesFetcherError extends Error {
  constructor(public code: NamesFetcherErrorCode, message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

const THE_GRAPH_PAGE_SIZE = 1000

const QUERY_NAMES_PAGINATED: string = `
  query fetchNamesByOwner($owner: String, $idFrom: String) {
    nfts(
      where: {owner: $owner, category: "ens", id_gt: $idFrom }
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      id,
      name,
      contractAddress,
      tokenId,
      activeOrder {
        price
      }
    }
}`

interface NamesQueryResponse {
  nfts: NameFromQuery[]
}

export type NameFromQuery = {
  id: string
  name: string
  contractAddress: string
  tokenId: string
  activeOrder?: {
    price: string
  }
}

async function runNamesQuery(subgraph: ISubgraphComponent, address: string): Promise<NameFromQuery[]> {
  const names = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: NamesQueryResponse
  do {
    result = await subgraph.query<NamesQueryResponse>(QUERY_NAMES_PAGINATED, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      names.push(nft)
    }

    idFrom = names[names.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return names
}

export async function createNamesFetcherComponent({
  theGraph,
  logs
}: Pick<AppComponents, 'logs' | 'theGraph'>): Promise<NamesFetcher> {
  const logger = logs.getLogger('names-fetcher')

  const cache = new LRU<string, Name[]>({
    max: 1000,
    ttl: 600000, // 10 minutes
    fetchMethod: async function (address: string, staleValue: Name[]) {
      try {
        const names = await runNamesQuery(theGraph.ensSubgraph, address)

        return names.map((n) => {
          const { name, contractAddress, tokenId, activeOrder } = n
          return {
            name,
            contractAddress,
            tokenId,
            price: activeOrder ? activeOrder.price : undefined
          }
        })
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<NamesResult> {
    const names = await cache.fetch(address)

    if (names === undefined) {
      throw new NamesFetcherError(NamesFetcherErrorCode.CANNOT_FETCH_NAMES, `Cannot fetch names for ${address}`)
    }

    const totalAmount = names.length
    return {
      names: names.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}
