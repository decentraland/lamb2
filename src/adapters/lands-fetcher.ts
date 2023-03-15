import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'

export type LANDsResult = {
  lands: LAND[]
  totalAmount: number
}

export type LANDsFetcher = IBaseComponent & {
  fetchByOwner(address: string, limits: Limits): Promise<LANDsResult>
}

export enum LANDsFetcherErrorCode {
  CANNOT_FETCH_LANDS
}

export class LANDsFetcherError extends Error {
  constructor(public code: LANDsFetcherErrorCode, message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

const THE_GRAPH_PAGE_SIZE = 1000

const QUERY_LANDS: string = `
  query fetchLANDsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { owner: $owner, category_in: [parcel, estate], id_gt: $idFrom },
      orderBy: transferredAt,
      orderDirection: desc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      id
      name,
      contractAddress,
      tokenId,
      category,
      parcel {
        x,
        y,
        data {
          description
        }
      }
      estate {
        data {
          description
        }
      },
      activeOrder {
        price
      },
      image
    }
  }`

interface LANDsQueryResponse {
  nfts: LANDFromQuery[]
}

export type LANDFromQuery = {
  id: string
  contractAddress: string
  tokenId: string
  category: string
  name: string | null
  parcel?: {
    x: string
    y: string
    data?: {
      description?: string
    }
  }
  estate?: {
    data?: {
      description?: string
    }
  }
  activeOrder?: {
    price: string
  }
  image: string
}

export type LAND = {
  contractAddress: string
  tokenId: string
  category: string
  name?: string
  x?: string
  y?: string
  description?: string
  price?: string
  image?: string
}

async function runLANDquery(subgraph: ISubgraphComponent, address: string): Promise<LANDFromQuery[]> {
  const lands = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: LANDsQueryResponse
  do {
    result = await subgraph.query<LANDsQueryResponse>(QUERY_LANDS, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      lands.push(nft)
    }

    idFrom = lands[lands.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return lands
}

export async function createLANDsFetcherComponent({
  theGraph,
  logs
}: Pick<AppComponents, 'logs' | 'theGraph'>): Promise<LANDsFetcher> {
  const logger = logs.getLogger('lands-fetcher')

  const cache = new LRU<string, LAND[]>({
    max: 1000,
    ttl: 600000, // 10 minutes
    fetchMethod: async function (address: string, staleValue: LAND[]) {
      try {
        const lands = await runLANDquery(theGraph.ensSubgraph, address)

        return lands.map((land) => {
          const { name, contractAddress, tokenId, category, parcel, estate, image, activeOrder } = land

          const isParcel = category === 'parcel'
          const x = isParcel ? parcel?.x : undefined
          const y = isParcel ? parcel?.x : undefined
          const description = isParcel ? parcel?.data?.description : estate?.data?.description
          return {
            name: name === null ? undefined : name,
            contractAddress,
            tokenId,
            category,
            x,
            y,
            description,
            price: activeOrder ? activeOrder.price : undefined,
            image
          }
        })
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<LANDsResult> {
    const lands = await cache.fetch(address)

    if (lands === undefined) {
      throw new LANDsFetcherError(LANDsFetcherErrorCode.CANNOT_FETCH_LANDS, `Cannot fetch lands for ${address}`)
    }

    const totalAmount = lands.length
    return {
      lands: lands.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    fetchByOwner
  }
}

// const QUERY_LANDS_OLD: string = `
//   query fetchLANDsByOwner($owner: String, $idFrom: String) {
//     nfts(
//       where: {owner: $owner, category: "ens", id_gt: $idFrom }
//       orderBy: id,
//       orderDirection: asc,
//       first: ${THE_GRAPH_PAGE_SIZE}
//     ) {
//       id,
//       land,
//       contractAddress,
//       tokenId,
//       activeOrder {
//         price
//       }
//     }
// }`
