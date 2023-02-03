import { transformNameToResponseSchema } from '../adapters/query-to-response'
import { runQuery } from '../ports/the-graph'
import { AppComponents, namesQueryResponse } from '../types'

const QUERY_NAMES: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"} 
    orderBy: transferredAt,
    orderDirection: desc,
  ) {
    name,
    contractAddress,
    tokenId,
    activeOrder {
      price
    }
  }
}`

const QUERY_NAMES_PAGINATED: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"} 
    orderBy: transferredAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    name,
    contractAddress,
    tokenId,
    activeOrder {
      price
    }
  }
}`

export async function getNamesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null
) {
  const { theGraph } = components

  // Set query depending on pagination
  let query
  if (pageSize && pageNum) {
    query = QUERY_NAMES_PAGINATED.replace('$owner', id.toLowerCase())
      .replace('$first', `${pageSize}`)
      .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)
  } else {
    query = QUERY_NAMES.replace('$owner', id.toLowerCase())
  }

  // Query owned names from TheGraph for the address
  const names = (await runQuery<namesQueryResponse>(theGraph.ensSubgraph, query, {})).nfts.map(
    transformNameToResponseSchema
  )
  return names
}
