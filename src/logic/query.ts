// import { ISubgraphComponent } from '@well-known-components/thegraph-component'
// import { createQueryForCategory } from '../adapters/items-fetcher'
// import { AppComponents, Item } from '../types'

// const THE_GRAPH_PAGE_SIZE = 1000

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

// type ElementsQueryResponse = {
//   nfts: any[]
// }

// type EmotesQueryResponse = {
//   nfts: string[]
// }

// async function fetchAllEmotesByOwner(components: Pick<AppComponents, 'theGraph'>, address: string): Promise<Item[]> {
//   const { theGraph } = components
//   return runPaginatedQuery<EmotesQueryResponse, Item>(theGraph.maticCollectionsSubgraph, address, 'emote')
// }

// async function runPaginatedQuery<T extends { nfts: any[] }, V>(
//   subgraph: ISubgraphComponent,
//   address: string,
//   category: ElementCategory
// ): Promise<V[]> {
//   const elements = []

//   const owner = address.toLowerCase()
//   let idFrom = ''
//   let result: T
//   const query = QUERIES[category]
//   do {
//     result = await subgraph.query<T>(query, {
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
