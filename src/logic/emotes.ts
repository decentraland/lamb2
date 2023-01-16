import { transformEmoteToResponseSchema, transformWearableToResponseSchema } from '../adapters/query-to-response'
import { runQuery } from '../ports/the-graph'
import { AppComponents, emotesQueryResponse, wearablesQueryResponse } from '../types'

const QUERY_EMOTES: string = `
{
  nfts(
    where: { owner: "$owner", category: "emote" },
    orderBy: transferredAt,
    orderDirection: desc
  ) {
    urn,
    id,
    contractAddress,
    tokenId,
    image,
    transferredAt,
    item {
      metadata {
        emote {
          name,
          description
        }
      },
      rarity,
      price
    }
  }
}`

const QUERY_EMOTES_PAGINATED: string = `
{
  nfts(
    where: { owner: "$owner", category: "emote" },
    orderBy: transferredAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    urn,
    id,
    contractAddress,
    tokenId,
    image,
    transferredAt,
    item {
      metadata {
        emote {
          name,
          description
        }
      },
      rarity,
      price
    }
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
  return (await runQuery<emotesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})).nfts.map(transformEmoteToResponseSchema)
}
