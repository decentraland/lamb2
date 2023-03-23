import { ISubgraphComponent } from '@well-known-components/thegraph-component'

type NFT = {
  id: string
}

type QueryResults<E extends NFT> = {
  nfts: E[]
}

export const THE_GRAPH_PAGE_SIZE = 1000

export async function fetchAllNFTs<T, E extends NFT>(
  subgraph: ISubgraphComponent,
  query: string,
  address: string,
  mapToModel: (e: E) => T
): Promise<T[]> {
  const elements = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: QueryResults<E>
  do {
    result = await subgraph.query<QueryResults<E>>(query, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      elements.push(nft)
    }

    idFrom = elements[elements.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return elements.map(mapToModel)
}
