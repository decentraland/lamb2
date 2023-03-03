import { EntityType } from '@dcl/schemas'
import { extractEmoteDefinitionFromEntity } from '../adapters/definitions'
import { transformEmoteToResponseSchema, transformThirdPartyAssetToEmoteForResponse } from '../adapters/nfts'
import { runQuery, TheGraphComponent } from '../ports/the-graph'
import { AppComponents, CategoryResponse, EmoteForResponse, EmotesQueryResponse } from '../types'
import { createThirdPartyResolverForCollection } from './third-party-wearables'

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

const QUERY_EMOTES_TOTAL_AMOUNT = `
{
  nfts(
    where: { owner: "$owner", category: "emote" }
    first: 1000
  ) {
    category
  }
}`

export async function getEmotesForAddress(
  { definitions, theGraph }: Pick<AppComponents, 'theGraph' | 'definitions'>,
  id: string,
  includeDefinitions: boolean,
  pageSize?: string | null,
  pageNum?: string | null
) {
  // If pagination is required, an extra query to retrieve the total amount of emotes is asynchronously made
  let query
  let emotes: EmoteForResponse[]
  let totalAmount
  if (pageSize && pageNum) {
    // Get a promise for calculating total amount of owned emotes
    const totalAmountPromise = runQueryForTotalAmount(id, theGraph)

    // Get a promise for a page of owned emotes
    const emotesPromise = runQueryForPaginatedEmotes(query, id, pageSize, pageNum, theGraph)

    // Wait for both queries to finish
    await Promise.all([totalAmountPromise, emotesPromise])

    // Get totalAmount from the query response
    totalAmount = (await totalAmountPromise).nfts.length

    // Get emotes from the query response
    emotes = (await emotesPromise).nfts.map(transformEmoteToResponseSchema)
  } else {
    emotes = await runQueryForAllEmotes(query, id, theGraph)

    totalAmount = emotes.length
  }

  if (includeDefinitions) {
    await definitions.decorateNFTsWithDefinitions(emotes, EntityType.EMOTE, extractEmoteDefinitionFromEntity)
  }

  return {
    emotes,
    totalAmount
  }
}

/*
 * Sets the query used to calculate total amount of emotes and runs it
 */
function runQueryForTotalAmount(id: string, theGraph: TheGraphComponent) {
  // Set query for the total amount request
  const totalAmountQuery = QUERY_EMOTES_TOTAL_AMOUNT.replace('$owner', id.toLowerCase())

  // Query for every emote with one single field for minimum payload to calculate the total amount
  return runQuery<CategoryResponse>(theGraph.maticCollectionsSubgraph, totalAmountQuery, {})
}

/*
 * Sets the query for paginated emotes and runs it
 */
function runQueryForPaginatedEmotes(
  query: any,
  id: string,
  pageSize: string,
  pageNum: string,
  theGraph: TheGraphComponent
) {
  // Set the query for the paginated request
  query = QUERY_EMOTES_PAGINATED.replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)

  // Query owned names from TheGraph for the address
  return runQuery<EmotesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})
}

/*
 * Sets the query for retrieving all emotes and runs it
 */
async function runQueryForAllEmotes(query: any, id: string, theGraph: TheGraphComponent) {
  // Set the query for the full request
  query = QUERY_EMOTES.replace('$owner', id.toLowerCase())

  // Query owned names from TheGraph for the address
  return (await runQuery<EmotesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})).nfts.map(
    transformEmoteToResponseSchema
  )
}

export async function getEmotesForCollection(
  components: Pick<AppComponents, 'theGraph' | 'fetch' | 'content' | 'emotesCaches' | 'definitions'>,
  collectionId: string,
  address: string,
  includeDefinitions: boolean
) {
  // Get API for collection
  const resolver = await createThirdPartyResolverForCollection(components, collectionId)

  // Get owned wearables for the collection
  let ownedTPEForCollection = (await resolver.findThirdPartyAssetsByOwner(address)).map(
    transformThirdPartyAssetToEmoteForResponse
  )

  if (includeDefinitions) {
    await components.definitions.decorateNFTsWithDefinitions(
      ownedTPEForCollection,
      EntityType.EMOTE,
      extractEmoteDefinitionFromEntity
    )
  }

  return {
    emotes: ownedTPEForCollection,
    totalAmount: ownedTPEForCollection.length
  }
}
