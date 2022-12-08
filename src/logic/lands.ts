import { runQuery } from '../ports/the-graph'
import { AppComponents } from '../types'

const QUERY_LANDS: string = `
{
  nfts(
    where: { owner: "$owner", category_in: [parcel, estate] },
    first: $first,
    skip: $skip
  ) {
    name
    parcel {
      x, y
    }
    estate {
      tokenId
    }
  }
}`

export async function getLandsForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize: number,
  pageNum: number
) {
  const { theGraph } = components

  // Set query
  const query = QUERY_LANDS
    .replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(pageNum - 1) * pageSize}`)

  // Query owned lands from TheGraph for the address
  const lands = await runQuery<any[]>(theGraph.ensSubgraph, query, {})
  return lands
}
