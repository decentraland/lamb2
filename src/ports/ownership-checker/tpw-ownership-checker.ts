import { parseUrn } from '@dcl/urn-resolver'
import { getCachedNFTsAndPendingCheckNFTs, fillCacheWithRecentlyCheckedWearables } from '../../logic/cache'
import { mergeMapIntoMap } from '../../logic/maps'
import { createThirdPartyResolverForCollection } from '../../logic/third-party-wearables'
import { AppComponents, NFTsOwnershipChecker, TPWResolver } from '../../types'

export function createTPWOwnershipChecker(
  components: Pick<AppComponents, 'theGraph' | 'thirdPartyProvidersStorage' | 'fetch' | 'content' | 'ownershipCaches'>
): NFTsOwnershipChecker {
  let ownedTPWByAddress: Map<string, string[]> = new Map()
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
  components: Pick<AppComponents, 'theGraph' | 'thirdPartyProvidersStorage' | 'fetch' | 'content'>,
  wearableIdsByAddress: Map<string, string[]>
): Promise<Map<string, string[]>> {
  const response = new Map()

  const collectionsByAddress = new Map<string, string[]>()
  const processedCollections = new Set<string>()
  const pendingResolversByCollections: Promise<TPWResolver>[] = []

  for (const [address, wearableIds] of wearableIdsByAddress) {
    const collectionIds = await filterCollectionIdsFromWearables(wearableIds) // This can be done before and store only collection ids
    collectionsByAddress.set(address, collectionIds)
    for (const collectionId of collectionIds) {
      if (processedCollections.has(collectionId)) {
        continue
      }

      processedCollections.add(collectionId)
      pendingResolversByCollections.push(createThirdPartyResolverForCollection(components, collectionId))
    }
  }

  const resolversByCollections = new Map<string, TPWResolver>()
  for (const resolver of await Promise.all(pendingResolversByCollections)) {
    resolversByCollections.set(resolver.collectionId, resolver)
  }

  for (const [address, collectionIds] of collectionsByAddress) {
    const ownedTPW: Set<string> = new Set()
    await Promise.all(
      collectionIds.map(async (collectionId) => {
        const resolver = resolversByCollections.get(collectionId)
        for (const asset of await resolver!.findThirdPartyAssetsByOwner(address)) {
          ownedTPW.add(asset.urn.decentraland)
        }
      })
    )

    const wearablesIds = wearableIdsByAddress.get(address)
    response.set(
      address,
      wearablesIds!.filter((tpw) => ownedTPW.has(tpw))
    )
  }

  return response
}

async function filterCollectionIdsFromWearables(wearableIds: string[]): Promise<string[]> {
  const collectionIds: string[] = []
  const parsedUrns = await Promise.allSettled(wearableIds.map(parseUrn))
  for (const result of parsedUrns) {
    if (result.status === 'fulfilled') {
      const parsedUrn = result.value
      if (parsedUrn?.type === 'blockchain-collection-third-party') {
        const collectionId = parsedUrn.uri.toString().split(':').slice(0, -1).join(':')
        collectionIds.push(collectionId)
      }
    }
  }

  return collectionIds
}
