import { AppComponents, ProfileMetadata, emoteForResponse, wearableFromQuery, wearablesQueryResponse, wearableForResponse } from "../types"
import { parseUrn } from '@dcl/urn-resolver'
import { runQuery } from "../ports/the-graph"
import { transformWearableToResponseSchema } from "../adapters/query-to-response"

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
          name,
          description
        }
      },
      rarity,
      price
    }
  }
}`

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph' | 'wearablesCache'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null,
  orderBy?: string | null
) {
  const { theGraph, wearablesCache } = components

  // Retrieve wearables for id from cache. They are stored sorted by creation date
  let allWearables = wearablesCache.get(id)

  // If it was a miss, a queries are done and the merged response is stored
  if (!allWearables) {
    // Set query
    const query = QUERY_WEARABLES.replace('$owner', id.toLowerCase())
    
    // Query owned wearables from TheGraph for the address
    const collectionsWearables = (await runQuery<wearablesQueryResponse>(theGraph.collectionsSubgraph, query, {})).nfts
    const maticWearables = (await runQuery<wearablesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})).nfts

    // Merge the resonses and sort by creation date
    allWearables =  groupByURN(collectionsWearables.concat(maticWearables)).sort(compareByCreatedAt)

    // Store the in the cache
    wearablesCache.set(id, allWearables)
  }

  // Set total amount of wearables
  let wearablesTotal = allWearables.length

  // Sort them by another field if specified
  if (orderBy === "rarity")
    allWearables = allWearables.sort(compareByRarity)

  // Virtually paginate the response if required
  if (pageSize && pageNum)
    allWearables = allWearables.slice((parseInt(pageNum) - 1) * parseInt(pageSize), parseInt(pageNum) * parseInt(pageSize))
  
  return {
    wearables: allWearables,
    totalAmount: wearablesTotal
  }
}

/* 
 * Groups every wearable with the same URN. Each of them has some data which differentiates them as individuals.
 * That data is stored in an array binded to the corresponding urn. Returns an array of wearables in the response format.
 */
function groupByURN(wearables: wearableFromQuery[]): wearableForResponse[] {
  // Initialize the map
  const wearablesByURN = new Map<string, wearableForResponse>()

  // Set the map with the wearables data
  wearables.forEach(wearable => {
    if (wearablesByURN.has(wearable.urn)) {
      // The wearable was present in the map, its individual data is added to the individualData array for that wearable
      const wearableFromMap = wearablesByURN.get(wearable.urn)
      wearableFromMap?.individualData.push({
        id: wearable.id,
        createdAt: wearable.createdAt,
        price: wearable.item.price  
      })
    } else {
      // The wearable was not present in the map, it is added and its individualData array is initialized with its data
      wearablesByURN.set(wearable.urn, transformWearableToResponseSchema(wearable))
    }
  })

  // Return the contents of the map as an array
  return Array.from(wearablesByURN.values())
}

/* 
 * Returns a positive number if wearable1 is older than wearable2, zero if they are equal, and a negative
 * number if wearable2 is older than wearable1. Can be used to sort wearables by creationDate, descending
 */
function compareByCreatedAt(wearable1: wearableForResponse, wearable2: wearableForResponse) {
  return (wearable2.individualData[0].createdAt - wearable1.individualData[0].createdAt)
}

/* 
 * Returns a positive number if wearable1 has a lower rarity than wearable2, zero if they are equal, and a negative
 * number if wearable2 has a lower rarity than wearable1. Can be used to sort wearables by rarity, descending
 */
function compareByRarity(wearable1: wearableForResponse, wearable2: wearableForResponse) {
  const rarities = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic',
    'unique',
  ]
  const w1RarityValue = rarities.findIndex((rarity) => rarity === wearable1.rarity)
  const w2RarityValue = rarities.findIndex((rarity) => rarity === wearable2.rarity)
  return (w2RarityValue - w1RarityValue)
}
