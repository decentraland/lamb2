import { AppComponents, ProfileMetadata } from "../types"
import { parseUrn } from '@dcl/urn-resolver'
import { runQuery } from "../ports/the-graph"
import { NFT } from "@dcl/schemas"

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

const QUERY_WEARABLES_PAGINATED: string = `
{
  nfts(
    where: { owner: "$owner", category: "wearable"},
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

interface wearablesQueryResponse {
  nfts: NFT[]
}

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null,
  paginationToken?: string | null
) {
  const { theGraph } = components

  // Set query depending if pagination is required
  let query
  if (pageSize && pageNum)
    query = QUERY_WEARABLES_PAGINATED
      .replace('$owner', id.toLowerCase())
      .replace('$first', `${pageSize}`)
      .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)
  else
    query = QUERY_WEARABLES.replace('$owner', id.toLowerCase())
  

  // Query owned wearables from TheGraph for the address
  const collectionsWearables = (await runQuery<wearablesQueryResponse>(theGraph.collectionsSubgraph, query, {})).nfts
  const maticWearables = (await runQuery<wearablesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {})).nfts

  if (pageSize && pageNum) {
    throw ("To be implemented")
  } else {
    // If pagination is not required, wearables from both collections are merged
    return collectionsWearables.concat(maticWearables)
  }
  return collectionsWearables
}
