import { AppComponents, Name } from '../../types'
import { fetchAllNFTs, THE_GRAPH_PAGE_SIZE } from './fetch-elements'

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

export type NameFromQuery = {
  id: string
  name: string
  contractAddress: string
  tokenId: string
  activeOrder?: {
    price: number
  }
}

export async function fetchAllNames(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Name[]> {
  return (await fetchAllNFTs<NameFromQuery>(components.theGraph.ensSubgraph, QUERY_NAMES_PAGINATED, owner)).map((n) => {
    const { name, contractAddress, tokenId, activeOrder } = n
    return {
      name,
      contractAddress,
      tokenId,
      price: activeOrder ? activeOrder.price : undefined
    }
  })
}
