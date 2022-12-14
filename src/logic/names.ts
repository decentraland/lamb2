import { runQuery } from '../ports/the-graph'
import { AppComponents } from '../types'

const QUERY_NAMES: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"} 
    orderBy: createdAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    id,
    name,
    contractAddress,
    soldAt,
    activeOrder {
      id,
      marketplaceAddress,
      category,
      price
    }
  }
}`

export async function getNamesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize: number,
  pageNum: number
) {
  const { theGraph } = components

  // Set query
  const query = QUERY_NAMES
    .replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(pageNum - 1) * pageSize}`)

  // Query owned names from TheGraph for the address
  const names = await runQuery<any[]>(theGraph.ensSubgraph, query, {})
  return names
}
