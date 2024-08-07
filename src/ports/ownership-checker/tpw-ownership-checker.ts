import { fillCacheWithRecentlyCheckedWearables, getCachedNFTsAndPendingCheckNFTs } from '../../logic/cache'
import { mergeMapIntoMap } from '../../logic/maps'
import { AppComponents, NFTsOwnershipChecker } from '../../types'
import { splitItemsURNsByTypeAndNetwork } from './contract-helpers'

export function createTPWOwnershipChecker(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'entitiesFetcher'
    | 'contentServerUrl'
    | 'l1ThirdPartyItemChecker'
    | 'l2ThirdPartyItemChecker'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'ownershipCaches'
    | 'logs'
    | 'metrics'
  >
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

    // Check ownership for the non-cached NFTs
    console.log('nftsToCheckByAddress', nftsToCheckByAddress, 'cachedOwnedNFTsByAddress', cachedOwnedNFTsByAddress)
    ownedTPWByAddress = await ownedThirdPartyWearables(components, nftsToCheckByAddress)

    // Traverse the checked NFTs to set the cache depending on its ownership
    fillCacheWithRecentlyCheckedWearables(nftsToCheckByAddress, ownedTPWByAddress, cache)

    // Merge cachedOwnedNFTsByAddress (contains the NFTs for which ownership was cached) into ownedWearablesByAddress
    // (recently checked ownership map)
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
 * sold through the blockchain without being reflected on the content server, so we
 * need to make sure that the user still owns every third-party wearable.
 * This method gets the collection ids from a wearableIdsByAddress map, for each of them
 * gets its API resolver, gets the owned third party wearables for that collection, and
 * finally sanitize wearableIdsByAddress with the owned wearables.
 */
async function ownedThirdPartyWearables(
  {
    contentServerUrl,
    metrics,
    l1ThirdPartyItemChecker,
    l2ThirdPartyItemChecker,
    thirdPartyProvidersStorage,
    fetch,
    logs,
    entitiesFetcher
  }: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'thirdPartyProvidersStorage'
    | 'l1ThirdPartyItemChecker'
    | 'l2ThirdPartyItemChecker'
    | 'fetch'
    | 'logs'
    | 'entitiesFetcher'
    | 'metrics'
  >,
  wearableIdsByAddress: Map<string, string[]>
): Promise<Map<string, string[]>> {
  console.log('wearableIdsByAddress', wearableIdsByAddress)

  const response = new Map<string, string[]>()

  for (const [address, wearableIds] of wearableIdsByAddress) {
    const { v1, l1ThirdParty, l2ThirdParty } = await splitItemsURNsByTypeAndNetwork(wearableIds)
    console.log('address', address, 'v1', v1, 'l1ThirdParty', l1ThirdParty, 'l2ThirdParty', l2ThirdParty)

    const results = await Promise.all([
      l1ThirdPartyItemChecker.checkThirdPartyItems(
        address,
        l1ThirdParty.map((tp) => tp.urn)
      ),
      l2ThirdPartyItemChecker.checkThirdPartyItems(
        address,
        l2ThirdParty.map((tp) => tp.urn)
      )
    ])
    response.set(address, [
      ...v1.map((tp) => tp.urn),
      ...l1ThirdParty.filter((tpw, idx) => results[0][idx]).map((tp) => tp.urn),
      ...l2ThirdParty.filter((tpw, idx) => results[1][idx]).map((tp) => tp.urn)
    ])
  }

  // for (const [address, collectionIds] of collectionsByAddress) {
  //   const ownedTPW: Set<string> = new Set()
  //   await Promise.all(
  //     collectionIds.map(async (collectionId) => {
  //       console.log('fetching', collectionId)
  //       for (const asset of await fetchUserThirdPartyAssets(
  //         { alchemyNftFetcher, contentServerUrl, thirdPartyProvidersStorage, fetch, logs, entitiesFetcher, metrics },
  //         address,
  //         collectionId
  //       )) {
  //         console.log('fetched', collectionId, asset)
  //         ownedTPW.add(asset.urn.decentraland.toLowerCase())
  //       }
  //     })
  //   )
  //
  //   const wearablesIds = wearableIdsByAddress.get(address)
  //   response.set(
  //     address,
  //     wearablesIds!.filter((tpw) => ownedTPW.has(tpw.toLowerCase()))
  //   )
  // }

  return response
}

// async function filterCollectionIdsFromWearables(wearableIds: string[]): Promise<string[]> {
//   console.log('wearableIds', wearableIds)
//   const collectionIds: string[] = []
//   const parsedUrns = await Promise.allSettled(wearableIds.map(parseUrn))
//   for (const result of parsedUrns) {
//     if (result.status === 'fulfilled') {
//       const parsedUrn = result.value
//       if (parsedUrn?.type === 'blockchain-collection-third-party') {
//         const collectionId = parsedUrn.uri.toString().split(':').slice(0, -1).join(':')
//         collectionIds.push(collectionId)
//       } else if (parsedUrn?.type === 'blockchain-collection-third-party-item') {
//         const collectionId = parsedUrn.uri.toString().split(':').slice(0, -4).join(':')
//         collectionIds.push(collectionId)
//       }
//     }
//   }
//
//   console.log('collectionIds', collectionIds)
//   return collectionIds
// }
