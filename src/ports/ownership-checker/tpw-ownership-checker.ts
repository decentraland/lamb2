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
    l1ThirdPartyItemChecker,
    l2ThirdPartyItemChecker
  }: Pick<AppComponents, 'l1ThirdPartyItemChecker' | 'l2ThirdPartyItemChecker'>,
  wearableIdsByAddress: Map<string, string[]>
): Promise<Map<string, string[]>> {
  const response = new Map<string, string[]>()

  for (const [address, wearableIds] of wearableIdsByAddress) {
    const { v1, l1ThirdParty, l2ThirdParty } = await splitItemsURNsByTypeAndNetwork(wearableIds)

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
      ...l1ThirdParty.filter((_tpw, idx) => results[0][idx]).map((tp) => tp.urn),
      ...l2ThirdParty.filter((_tpw, idx) => results[1][idx]).map((tp) => tp.urn)
    ])
  }

  return response
}
