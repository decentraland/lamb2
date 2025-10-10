import LRU from 'lru-cache'
import { Request } from 'node-fetch'

/**
 * Checks if the request has the bypass cache header
 * Supports both X-Bypass-Cache header and Cache-Control: no-cache
 */
export function shouldBypassCache(request: Request): boolean {
  // Check for X-Bypass-Cache header
  const bypassHeader = request.headers.get('x-bypass-cache')
  if (bypassHeader === 'true' || bypassHeader === '1') {
    return true
  }

  // Check for Cache-Control: no-cache
  const cacheControl = request.headers.get('cache-control')
  if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
    return true
  }

  return false
}

/*
 * Reads the provided map and returns those nfts that are cached and those that are unknown.
 * The cache must be {adress -> {nft -> isOwned} }.
 * If bypassCache is true, returns all NFTs as pending check.
 */
export function getCachedNFTsAndPendingCheckNFTs(
  ownedNFTsByAddress: Map<string, string[]>,
  cache: LRU<string, Map<string, boolean>>,
  bypassCache = false
) {
  const nftsToCheckByAddress: Map<string, string[]> = new Map()
  const cachedOwnedNFTsByAddress: Map<string, string[]> = new Map()

  // If bypassing cache, return all NFTs as pending check
  if (bypassCache) {
    return {
      nftsToCheckByAddress: ownedNFTsByAddress,
      cachedOwnedNFTsByAddress
    }
  }

  for (const [address, nfts] of ownedNFTsByAddress.entries()) {
    if (cache.has(address)) {
      // Get a map {nft -> isOwned} for address
      const cachedOwnershipForAddress = cache.get(address)

      // Check for every nft if it is in the cache and add them to cachedOwnedNfts or nftsToCheck
      const cachedOwnedNfts = []
      const nftsToCheck = []
      for (const nft of nfts) {
        // If the nft is present on the map, ownership for the nft won't be checked in the blockchain.
        if (cachedOwnershipForAddress?.has(nft)) {
          // If the nft is owned, it will be added to the cached owned map. If not, it is ignored.
          if (cachedOwnershipForAddress.get(nft)) {
            cachedOwnedNfts.push(nft)
          }
        } else {
          // Add the nft to the nftsToCheck
          nftsToCheck.push(nft)
        }
      }

      // Add cached nfts to the cached map
      if (cachedOwnedNfts.length > 0) {
        cachedOwnedNFTsByAddress.set(address, cachedOwnedNfts)
      }

      // Add nfts to be checked to the map to be checked
      if (nftsToCheck.length > 0) {
        nftsToCheckByAddress.set(address, nftsToCheck)
      }
    } else {
      // Since the address is not cached, add every nft for the address to the nftsToCheck
      nftsToCheckByAddress.set(address, nfts)
    }
  }
  return { nftsToCheckByAddress, cachedOwnedNFTsByAddress }
}

/*
 * Traverse the already checked nfts to set the cache depending on its ownership
 */
export function fillCacheWithRecentlyCheckedWearables(
  checkedNFTsByAddress: Map<string, string[]>,
  ownedNFTsByAddress: Map<string, string[]>,
  cache: LRU<string, Map<string, boolean>>
) {
  for (const [address, nfts] of checkedNFTsByAddress) {
    const ownedNftsForAddress = ownedNFTsByAddress.get(address)

    // Get the cached map for the address or initialize it if address is not present
    let ownershipForAddressToBeCached: Map<string, boolean>
    if (cache.has(address)) {
      ownershipForAddressToBeCached = cache.get(address) ?? new Map()
    } else {
      ownershipForAddressToBeCached = new Map()
    }

    // Fill the map with the recently adquired nfts ownership
    for (const nft of nfts) {
      if (ownedNftsForAddress) {
        ownershipForAddressToBeCached?.set(nft, ownedNftsForAddress.includes(nft))
      } else {
        // Address isn't in the ownership map so the nft is not owned by this address
        ownershipForAddressToBeCached?.set(nft, false)
      }
    }

    // Set the map to the cache
    cache.set(address, ownershipForAddressToBeCached)
  }
}
