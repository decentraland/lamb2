import { runQuery } from '../ports/the-graph'
import { AppComponents } from '../types'

const QUERY_EMOTES: string = `
{
  nfts(
    where: { owner: "$owner", category: "emote" },
    orderBy: createdAt,
    orderDirection: desc
  ) {
    urn,
    id,
    item {
      metadata {
        wearable {
          name
        }
      }
    },
    category,
    createdAt
  }
}`

const QUERY_EMOTES_PAGINATED: string = `
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
    item {
      metadata {
        wearable {
          name
        }
      }
    },
    category,
    createdAt
  }
}`

export async function getEmotesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null
) {
  const { theGraph } = components

  // Set query depending on pagination
  let query
  if (pageSize && pageNum) {
    query = QUERY_EMOTES_PAGINATED
      .replace('$owner', id.toLowerCase())
      .replace('$first', `${pageSize}`)
      .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)
  } else {
    query = QUERY_EMOTES.replace('$owner', id.toLowerCase())
  }

  // Query owned names from TheGraph for the address
  const names = await runQuery<any[]>(theGraph.maticCollectionsSubgraph, query, {})
  return names
}
