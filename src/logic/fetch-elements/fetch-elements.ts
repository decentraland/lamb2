import { ISubgraphComponent } from '@well-known-components/thegraph-component'

type NFT = {
  id: string
}

type QueryResults<E extends NFT> = {
  nfts: E[]
}

export const THE_GRAPH_PAGE_SIZE = 1000

export async function fetchAllNFTs<E extends NFT>(
  subgraph: ISubgraphComponent,
  query: string,
  address: string
): Promise<E[]> {
  const elements = []

  const owner = address.toLowerCase()
  let idFrom: string = ''
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

    const idFromLastElement = elements[elements.length - 1].id

    if (!idFromLastElement) {
      throw new Error('Error getting id from last entity from previous page')
    }

    idFrom = idFromLastElement
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return elements
}
