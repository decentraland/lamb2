import { AppComponents, ProfileMetadata } from "../types"
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
    where: {owner: "$owner" },
    searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1"],
    orderBy: updatedAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    urn,
    id,
    category,
    updatedAt
  }
}`

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize: number,
  pageNum: number
) {
  const { theGraph } = components

  // Set query
  const query = QUERY_WEARABLES.replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(pageNum - 1) * pageSize}`)

  // Query wearables from TheGraph
  const collections = await runQuery<any[]>(theGraph.collectionsSubgraph, query, {})
  const matic = await runQuery<any[]>(theGraph.maticCollectionsSubgraph, query, {})
  console.log(collections)
  console.log(matic)
  return collections
}
