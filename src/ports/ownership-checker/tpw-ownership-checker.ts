import { parseUrn } from '@dcl/urn-resolver'
import { getCachedNFTsAndPendingCheckNFTs, fillCacheWithRecentlyCheckedWearables } from '../../logic/cache'
import { fetchUserThirdPartyAssets } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { mergeMapIntoMap } from '../../logic/maps'
import { AppComponents, NFTsOwnershipChecker } from '../../types'

export function createTPWOwnershipChecker(
  components: Pick<AppComponents, 'thirdPartyProvidersStorage' | 'fetch' | 'ownershipCaches' | 'logs' | 'metrics'>
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
  {
    metrics,
    thirdPartyProvidersStorage,
    fetch,
    logs
  }: Pick<AppComponents, 'thirdPartyProvidersStorage' | 'fetch' | 'logs' | 'metrics'>,
  wearableIdsByAddress: Map<string, string[]>
): Promise<Map<string, string[]>> {
  const response = new Map<string, string[]>()

  const collectionsByAddress = new Map<string, string[]>()
  for (const [address, wearableIds] of wearableIdsByAddress) {
    const collectionIds = await filterCollectionIdsFromWearables(wearableIds)
    collectionsByAddress.set(address, collectionIds)
  }

  for (const [address, collectionIds] of collectionsByAddress) {
    const ownedTPW: Set<string> = new Set()
    await Promise.all(
      collectionIds.map(async (collectionId) => {
        for (const asset of await fetchUserThirdPartyAssets(
          { thirdPartyProvidersStorage, fetch, logs, metrics },
          address,
          collectionId
        )) {
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
