import { parseUrn } from "@dcl/urn-resolver";
import { AppComponents, NFTsOwnershipChecker, ThirdPartyAsset, ThirdPartyAssets, TPWResolver } from "../../types";
import { runQuery } from "../the-graph";

export function createTPWOwnershipChecker(cmpnnts: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">): NFTsOwnershipChecker {

    let ownedTPWByAddress: Map<string, string[]> = new Map()
    const components = cmpnnts

    function addNFTsForAddress(address: string, nfts: string[]) {
        ownedTPWByAddress.set(address, nfts)
    }

    async function checkNFTsOwnership() {
        ownedTPWByAddress = await ownedThirdPartyWearables(components, ownedTPWByAddress)
    }

    function getOwnedNFTsForAddress(address: string) {
        return ownedTPWByAddress.get(address) ?? []
    }
    
    return {
        addNFTsForAddress,
        checkNFTsOwnership,
        getOwnedNFTsForAddress
    }
}

const QUERY_THIRD_PARTY_RESOLVER = `
query ThirdPartyResolver($id: String!) {
  thirdParties(where: {id: $id, isApproved: true}) {
    id
    resolver
  }
}
`

/*
 * It could happen that a user had a third-party wearable in its profile which it was
 * selled through the blockchain without being reflected on the content server, so we 
 * need to make sure that every third-party wearable it is still owned by the user.
 * This method gets the collection ids from a wearableIdsByAddress map, for each of them
 * gets its API resolver, gets the owned third party wearables for that collection, and
 * finally sanitize wearableIdsByAddress with the owned wearables.
 */
async function ownedThirdPartyWearables(components: Pick<AppComponents, "theGraph" | "fetch" | "content">, wearableIdsByAddress: Map<string, string[]>): Promise<Map<string, string[]>> {
  const response = new Map()
  for (const [address, wearableIds] of wearableIdsByAddress) {

    // Get collectionIds from all wearables
    const collectionIds = await filterCollectionIdsFromWearables(wearableIds)  // This can be done before and store only collection ids

    // Get all owned TPW for every collectionId
    const ownedTPW: Set<string> = new Set()
    for (const collectionId of collectionIds) {
        // Get API for collection
        const resolver = await createThirdPartyResolverForCollection(components, collectionId)  // COULD BE CACHED?

        // Get owned wearables for the collection
        const ownedTPWForCollection = await resolver.findWearablesByOwner(address)

        // Add wearables for collection to all owned wearables set
        for (const tpw of ownedTPWForCollection)
          ownedTPW.add(tpw)
    } 

    // Filter the wearables from the map with the actually owned wearables
    const sanitizedWearables = wearableIds.filter((tpw) => ownedTPW.has(tpw))

    // Add wearables to final response
    response.set(address, sanitizedWearables)

  }
  return response
}

async function filterCollectionIdsFromWearables(wearableIds: string[]): Promise<string[]> {
  const collectionIds: string[] = []
  for (const wearableId of wearableIds) {
      try {
          const parsedUrn = await parseUrn(wearableId)
          if (parsedUrn?.type === 'blockchain-collection-third-party') {
              const collectionId = parsedUrn.uri.toString().split(':').slice(0, -1).join(':')
              collectionIds.push(collectionId)
          }
      } catch (error) {
          console.debug(`There was an error parsing the urn: ${wearableId}`)
      }
  }
  return collectionIds
}

async function createThirdPartyResolverForCollection(components: Pick<AppComponents, "theGraph" | "fetch">, collectionId: string): Promise<TPWResolver> {
  // Parse collection Id
  const { thirdPartyId, registryId } = parseCollectionId(collectionId)

  // Get resolver
  const thirdPartyResolverAPI = await findThirdPartyResolver(components, thirdPartyId)
  if (!thirdPartyResolverAPI) throw new Error(`Could not find third party resolver for collectionId: ${collectionId}`)

  return {
    findWearablesByOwner: async (owner) => {
      const assetsByOwner = await fetchAssets(components, thirdPartyResolverAPI, registryId, owner)
      if (!assetsByOwner) throw new Error(`Could not fetch assets for owner: ${owner}`)
      return (
        assetsByOwner
          ?.filter((asset) => asset.urn.decentraland.startsWith(thirdPartyId))
          .map((asset) => asset.urn.decentraland) ?? []
      )
    }
  }
}


// urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
// urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}
function parseCollectionId(collectionId: string): { thirdPartyId: string, registryId: string} {
  const parts = collectionId.split(':')

  // TODO: [TPW] Use urn parser here
  if (!(parts.length === 5 || parts.length === 6)) {
    throw new Error(`Couldn't parse collectionId ${collectionId}, valid ones are like:
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}`)
  }

  return {
    thirdPartyId: parts.slice(0, 5).join(':'),
    registryId: parts[4]
  }
}

/**
 * Returns the third party resolver API to be used to query assets from any collection
 * of given third party integration
 */
async function findThirdPartyResolver(components: Pick<AppComponents, "theGraph">, id: string): Promise<string | undefined> {
  const queryResponse = await runQuery<{ thirdParties: [{ resolver: string }] }>(components.theGraph.thirdPartyRegistrySubgraph, QUERY_THIRD_PARTY_RESOLVER, { id })
  return queryResponse.thirdParties[0]?.resolver
}

async function fetchAssets(components: Pick<AppComponents, "fetch">, thirdPartyResolverURL: string, registryId: string, owner: string) {
  let baseUrl: string | undefined = buildRegistryOwnerUrl(thirdPartyResolverURL, registryId, owner)
  const allAssets: ThirdPartyAsset[] = []

  try {
    do {
      const response = await components.fetch.fetch(baseUrl)
      const assetsByOwner = (await response.json()) as ThirdPartyAssets
      if (!assetsByOwner) {
        console.error(`No assets found with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} at ${baseUrl}`)
        break
      }

      for (const asset of assetsByOwner?.assets ?? []) {
        allAssets.push(asset)
      }

      baseUrl = assetsByOwner.next
    } while (baseUrl)

    return allAssets
  } catch (e) {
    console.error(e)
    throw new Error(
      `Error fetching assets with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} (${baseUrl})`
    )
  }
}

function buildRegistryOwnerUrl(thirdPartyResolverURL: string, registryId: string, owner: string): string {
  const baseUrl = new URL(thirdPartyResolverURL).href.replace(/\/$/, '')
  return `${baseUrl}/registry/${registryId}/address/${owner}/assets`
}
