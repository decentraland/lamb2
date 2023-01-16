import { transformLandToResponseSchema } from '../adapters/query-to-response'
import { runQuery } from '../ports/the-graph'
import { AppComponents, landsQueryResponse } from '../types'

const QUERY_LANDS: string = `
{
  nfts(
    where: { owner: "$owner", category_in: [parcel, estate] },
    orderBy: transferredAt,
    orderDirection: desc
  ) {
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

const QUERY_LANDS_PAGINATED: string = `
{
  nfts(
    where: { owner: "$owner", category_in: [parcel, estate] },
    orderBy: transferredAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
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
  const lands = (await runQuery<landsQueryResponse>(theGraph.ensSubgraph, query, {})).nfts.map(transformLandToResponseSchema)
  return lands
}
