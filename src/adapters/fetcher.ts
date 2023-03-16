// import LRU from 'lru-cache'
// import { IBaseComponent } from '@well-known-components/interfaces'
// import { AppComponents, Limits } from '../types'
// import { ISubgraphComponent } from '@well-known-components/thegraph-component'
// import { createQueryForCategory } from './items-fetcher'

// export type ElementsResult<T> = {
//   elements: T[]
//   totalAmount: number
// }

// export type ElementsFetcher<T> = IBaseComponent & {
//   fetchByOwner(address: string, limits: Limits): Promise<ElementsResult<T>>
// }

// export enum ElementsFetcherErrorCode {
//   CANNOT_FETCH_ELEMENTS
// }

// export class ElementsFetcherError extends Error {
//   constructor(public code: ElementsFetcherErrorCode, message: string) {
//     super(message)
//     Error.captureStackTrace(this, this.constructor)
//   }
// }

// const THE_GRAPH_PAGE_SIZE = 1000

// type ElementsQueryResponse = {
//   nfts: any[]
// }

// type ElementCategory = 'wearable' | 'emote' | 'name' | 'land'

// const QUERIES: Record<ElementCategory, string> = {
//   emote: createQueryForCategory('emote'),
//   wearable: createQueryForCategory('wearable'),
//   name: `
//     query fetchNamesByOwner($owner: String, $idFrom: String) {
//       nfts(
//         where: {owner: $owner, category: "ens", id_gt: $idFrom }
//         orderBy: id,
//         orderDirection: asc,
//         first: ${THE_GRAPH_PAGE_SIZE}
//       ) {
//         id,
//         name,
//         contractAddress,
//         tokenId,
//         activeOrder {
//           price
//         }
//       }
//     }`,
//   land: `
//     query fetchLANDsByOwner($owner: String, $idFrom: String) {
//       nfts(
//         where: { owner: $owner, category_in: [parcel, estate], id_gt: $idFrom },
//         orderBy: transferredAt,
//         orderDirection: desc,
//         first: ${THE_GRAPH_PAGE_SIZE}
//       ) {
//         id
//         name,
//         contractAddress,
//         tokenId,
//         category,
//         parcel {
//           x,
//           y,
//           data {
//             description
//           }
//         }
//         estate {
//           data {
//             description
//           }
//         },
//         activeOrder {
//           price
//         },
//         image
//       }
//     }`
// }

// async function runQuery(subgraph: ISubgraphComponent, address: string, category: ElementCategory): Promise<any[]> {
//   const elements = []

//   const owner = address.toLowerCase()
//   let idFrom = ''
//   let result: ElementsQueryResponse
//   const query = QUERIES[category]
//   do {
//     result = await subgraph.query<ElementsQueryResponse>(query, {
//       owner,
//       idFrom
//     })

//     if (result.nfts.length === 0) {
//       break
//     }

//     for (const nft of result.nfts) {
//       elements.push(nft)
//     }

//     idFrom = elements[elements.length - 1].id
//   } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
//   return elements
// }

// export async function createElementsFetcherComponent<T>(
//   { theGraph, logs }: Pick<AppComponents, 'logs' | 'theGraph'>,
//   category: ElementCategory,
//   mapToElement: (elementFromResponse: any) => T
// ): Promise<ElementsFetcher<T>> {
//   const logger = logs.getLogger(`${category}-fetcher`)

//   const cache = new LRU<string, T[]>({
//     max: 1000,
//     ttl: 600000, // 10 minutes
//     fetchMethod: async function (address: string, staleValue: T[]) {
//       try {
//         const elements = await runQuery(theGraph.ensSubgraph, address, category)
//         return elements.map(mapToElement)
//       } catch (err: any) {
//         logger.error(err)
//         return staleValue
//       }
//     }
//   })

//   async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<ElementsResult<T>> {
//     const elements = await cache.fetch(address)

//     if (elements === undefined) {
//       throw new ElementsFetcherError(
//         ElementsFetcherErrorCode.CANNOT_FETCH_ELEMENTS,
//         `Cannot fetch ${category}s for ${address}`
//       )
//     }

//     const totalAmount = elements.length
//     return {
//       elements: elements.slice(offset, offset + limit),
//       totalAmount
//     }
//   }

//   return {
//     fetchByOwner
//   }
// }
