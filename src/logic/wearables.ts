import { AppComponents, ProfileMetadata, wearableForResponse, wearableFromQuery, wearablesQueryResponse } from "../types"
import { parseUrn } from '@dcl/urn-resolver'
import { runQuery } from "../ports/the-graph"

export async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<string[]> {
    const wearablesInProfile: string[] = []
    for (const avatar of metadata.avatars) {
      for (const wearableId of avatar.avatar.wearables) {
        if (!isBaseAvatar(wearableId)) {
            const translatedWearableId = await translateWearablesIdFormat(wearableId)
            if (translatedWearableId)
                wearablesInProfile.push(translatedWearableId)
        }
      }
    }
    const filteredWearables = wearablesInProfile.filter((wearableId): wearableId is string => !!wearableId)
    return filteredWearables
}

function isBaseAvatar(wearable: string): boolean {
    return wearable.includes('base-avatars')
}

// Translates from the old id format into the new one
export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
    if (!wearableId.startsWith('dcl://'))
        return wearableId
    
    const parsed = await parseUrn(wearableId)
    return parsed?.uri?.toString()
}

const QUERY_WEARABLES: string = `
{
  nfts(
    where: { owner: "$owner", category: "wearable"},
    orderBy: createdAt,
    orderDirection: desc
  ) {
    urn,
    id,
    image,
    createdAt,
    item {
      metadata {
        wearable {
          name
        }
      }
    }
  }
}`

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph' | 'wearablesCache'>,
  id: string,
  pageSize?: number,
  pageNum?: number
) {
  const { theGraph, wearablesCache } = components

  // Retrieve wearables for id from cache. They are stored sorted by creation date
  let allWearables = wearablesCache.get(id)

  // If it was a miss, a queries are done and the merged response is stored
  if (!allWearables) {
    // Set query
    const query = QUERY_WEARABLES.replace('$owner', id.toLowerCase())
    
    // Query owned wearables from TheGraph for the address
    const collectionsWearables = (await runQuery<wearablesQueryResponse>(theGraph.collectionsSubgraph, query, {})).nfts.map(transformToResponseSchema)
    const maticWearables = (await runQuery<wearablesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})).nfts.map(transformToResponseSchema)

    // Merge the resonses and sort by creation date
    allWearables =  collectionsWearables.concat(maticWearables).sort(compareByCreatedAt)

    // Store the in the cache
    wearablesCache.set(id, allWearables)
  }

  // Return a paginated response if required
  if (pageSize && pageNum)
    return allWearables.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  else
    return allWearables
}

/* 
 * Adapts the result from the query to the desired schema for the response
 */
function transformToResponseSchema(wearable: wearableFromQuery): wearableForResponse {
  return {
    urn: wearable.urn,
    id: wearable.id,
    image: wearable.image,
    createdAt: wearable.createdAt,
    name: wearable.item.metadata.wearable.name
  }
}

/* 
 * Returns a positive number if nft1 is older than nft2, zero if they are equal, and a negative
 * number if nft2 is older than nft1. Can be used to sorts nfts by creationDate, descending
 */
function compareByCreatedAt(wearable1: wearableForResponse, wearable2: wearableForResponse) {
  return (wearable2.createdAt - wearable1.createdAt)
}