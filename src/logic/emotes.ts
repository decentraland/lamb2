import { runQuery } from '../ports/the-graph'
import { AppComponents } from '../types'

const QUERY_EMOTES: string = `
{
  nfts(
    where: { owner: "$owner", category: "emote" },
    orderBy: createdAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    urn,
    id,
    category,
    createdAt
  }
}`

export async function getEmotesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize: number,
  pageNum: number
) {
  const { theGraph } = components

  // Set query
  const query = QUERY_EMOTES
    .replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(pageNum - 1) * pageSize}`)

  // Query owned names from TheGraph for the address
  const names = await runQuery<any[]>(theGraph.maticCollectionsSubgraph, query, {})
  return names
}
