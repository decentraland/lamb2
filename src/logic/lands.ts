import { runQuery } from '../ports/the-graph'
import { AppComponents } from '../types'

const QUERY_LANDS: string = `
{
  nfts(
    where: { owner: "$owner", category_in: [parcel, estate] }
  ) {
    name,
    contractAddress,
    category,
    parcel {
      x, y,
			data {
			  id,
        name,
        description
			}
    }
    estate {
      tokenId,
      data {
        id,
        description
      }
    },
    activeOrder {
      id,
      category,
      status,
      price
    },
    image
  }
}`

const QUERY_LANDS_PAGINATED: string = `
{
  nfts(
    where: { owner: "$owner", category_in: [parcel, estate] },
    first: $first,
    skip: $skip
  ) {
    name,
    contractAddress,
    category,
    parcel {
      x, y,
			data {
			  id,
        name,
        description
			}
    }
    estate {
      tokenId,
      data {
        id,
        description
      }
    },
    activeOrder {
      id,
      category,
      status,
      price
    },
    image
  }
}`

export async function getLandsForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null
) {
  const { theGraph } = components

  // Set query depending on pagination
  let query
  if (pageSize && pageNum) {
    query = QUERY_LANDS_PAGINATED
      .replace('$owner', id.toLowerCase())
      .replace('$first', `${pageSize}`)
      .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)
  } else {
    query = QUERY_LANDS.replace('$owner', id.toLowerCase())
  }

  // Query owned lands from TheGraph for the address
  const lands = await runQuery<any[]>(theGraph.ensSubgraph, query, {})
  return lands
}
