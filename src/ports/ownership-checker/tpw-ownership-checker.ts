import { parseUrn } from '@dcl/urn-resolver'
import { getCachedNFTsAndPendingCheckNFTs, fillCacheWithRecentlyCheckedWearables } from '../../logic/cache'
import { mergeMapIntoMap } from '../../logic/maps'
import { createThirdPartyResolverForCollection } from '../../logic/third-party-wearables'
import { AppComponents, NFTsOwnershipChecker, ThirdPartyAsset } from '../../types'

export function createTPWOwnershipChecker(
  cmpnnts: Pick<AppComponents, 'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches'>
): NFTsOwnershipChecker {
  let ownedTPWByAddress: Map<string, string[]> = new Map()
  const components = cmpnnts
  const cache = components.ownershipCaches.tpwCache

  function addNFTsForAddress(address: string, nfts: string[]) {
    ownedTPWByAddress.set(address, nfts)
  }

  async function checkNFTsOwnership() {
    // Check the cache before checking ownership in the blockchain
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(
      ownedTPWByAddress,
      cache
    )

    // Check ownership for the non-cached nfts
    ownedTPWByAddress = await ownedThirdPartyWearables(components, nftsToCheckByAddress)

    // Traverse the checked nfts to set the cache depending on its ownership
    fillCacheWithRecentlyCheckedWearables(nftsToCheckByAddress, ownedTPWByAddress, cache)

    // Merge cachedOwnedNFTsByAddress (contains the nfts which ownershipwas cached) into ownedWearablesByAddress (recently checked ownnership map)
    mergeMapIntoMap(cachedOwnedNFTsByAddress, ownedTPWByAddress)
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

/*
 * It could happen that a user had a third-party wearable in its profile which it was
 * selled through the blockchain without being reflected on the content server, so we
 * need to make sure that every third-party wearable it is still owned by the user.
 * This method gets the collection ids from a wearableIdsByAddress map, for each of them
 * gets its API resolver, gets the owned third party wearables for that collection, and
 * finally sanitize wearableIdsByAddress with the owned wearables.
 */
async function ownedThirdPartyWearables(
  components: Pick<AppComponents, 'theGraph' | 'fetch' | 'content'>,
  wearableIdsByAddress: Map<string, string[]>
): Promise<Map<string, string[]>> {
  const response = new Map()
  for (const [address, wearableIds] of wearableIdsByAddress) {
    // Get collectionIds from all wearables
    const collectionIds = await filterCollectionIdsFromWearables(wearableIds) // This can be done before and store only collection ids

    // Get all owned TPW for every collectionId
    const ownedTPW: Set<string> = new Set()
    for (const collectionId of collectionIds) {
      // Get API for collection
      const resolver = await createThirdPartyResolverForCollection(components, collectionId)

      // Get owned wearables for the collection
      const ownedTPWForCollection = (await resolver.findWearablesByOwner(address)).map(
        (asset: ThirdPartyAsset) => asset.urn.decentraland
      )

      // Add wearables for collection to all owned wearables set
      for (const tpw of ownedTPWForCollection) ownedTPW.add(tpw)
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
