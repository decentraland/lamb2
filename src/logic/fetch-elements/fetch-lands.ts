import { AppComponents, LAND } from '../../types'
import { fetchAllNFTs, THE_GRAPH_PAGE_SIZE } from './fetch-elements'

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
    price: number
  }
  image?: string
}

export async function fetchAllLANDs(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<LAND[]> {
  return (await fetchAllNFTs<LANDFromQuery>(components.theGraph.ensSubgraph, QUERY_LANDS, owner)).map((land) => {
    const { name, contractAddress, tokenId, category, parcel, estate, image, activeOrder } = land
    const isParcel = category === 'parcel'
    const x = isParcel ? parcel?.x : undefined
    const y = isParcel ? parcel?.y : undefined
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
}
