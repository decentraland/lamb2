import { fillCacheWithRecentlyCheckedWearables, getCachedNFTsAndPendingCheckNFTs } from "../../src/logic/cache"
import LRU from 'lru-cache'


describe("cache unit tests", () => {
  describe("getCachedNFTsAndPendingCheckNFTs", () => {
    it("must return empty maps when empty map and cache are passed", async () => {
      const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(new Map(), new LRU({ max: 10, ttl: 10}))
      expect(nftsToCheckByAddress.size).toEqual(0)
      expect(cachedOwnedNFTsByAddress.size).toEqual(0)
    })
    it("must return no cached elements when the cache is empty", async () => {
      const ownedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']]
      ])
      const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(ownedNFTsByAddress, new LRU({ max: 10, ttl: 10}))
      expect(nftsToCheckByAddress).toEqual(ownedNFTsByAddress)
      expect(cachedOwnedNFTsByAddress.size).toEqual(0)
    })

    it("must return as cached the nfts that are already cached", async () => {
      const ownedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']],
        ['0x2', ['nft1', 'nft2']]
      ])
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true]]))
      cache.set('0x2', new Map([['nft2', true]]))
      
      const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(ownedNFTsByAddress, cache)
      
      expect(nftsToCheckByAddress.size).toEqual(2)
      expect(nftsToCheckByAddress.has('0x1')).toBe(true)
      expect(nftsToCheckByAddress.get('0x1')).toEqual(['nft2'])
      expect(nftsToCheckByAddress.has('0x2')).toBe(true)
      expect(nftsToCheckByAddress.get('0x2')).toEqual(['nft1'])
      expect(cachedOwnedNFTsByAddress.size).toEqual(2)
      expect(cachedOwnedNFTsByAddress.has('0x1')).toBe(true)
      expect(cachedOwnedNFTsByAddress.get('0x1')).toEqual(['nft1'])
      expect(cachedOwnedNFTsByAddress.has('0x2')).toBe(true)
      expect(cachedOwnedNFTsByAddress.get('0x2')).toEqual(['nft2'])
    })

    it("must return ignore the nfts that are cached as false", async () => {
      const ownedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']],
        ['0x2', ['nft1', 'nft2']]
      ])
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true], ['nft2', false]]))
      cache.set('0x2', new Map([['nft1', false], ['nft2', true]]))
      
      const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(ownedNFTsByAddress, cache)
      
      expect(nftsToCheckByAddress.size).toEqual(0)
      expect(cachedOwnedNFTsByAddress.size).toEqual(2)
      expect(cachedOwnedNFTsByAddress.has('0x1')).toBe(true)
      expect(cachedOwnedNFTsByAddress.get('0x1')).toEqual(['nft1'])
      expect(cachedOwnedNFTsByAddress.has('0x2')).toBe(true)
      expect(cachedOwnedNFTsByAddress.get('0x2')).toEqual(['nft2'])
    })
  })

  describe("fillCacheWithRecentlyCheckedWearables", () => {
    it("must do nothing to the cache if the checked nfts map is empty", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true]]))
      cache.set('0x2', new Map([['nft2', false]]))
      
      fillCacheWithRecentlyCheckedWearables(new Map(), new Map(), cache)

      expect(Array.from(cache.keys()).length).toEqual(2)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(true)
      expect(cache.has('0x2')).toBe(true)
      expect(cache.get('0x2').has('nft2')).toBe(true)
      expect(cache.get('0x2').get('nft2')).toBe(false)
    })

    it("must set to false in the cache every nft that is found in the checked map but is not in the ownership map", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      
      const checkedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']],
        ['0x2', ['nft1', 'nft2']]
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, new Map(), cache)

      expect(Array.from(cache.keys()).length).toEqual(2)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(false)
      expect(cache.get('0x1').has('nft2')).toBe(true)
      expect(cache.get('0x1').get('nft2')).toBe(false)
      expect(cache.has('0x2')).toBe(true)
      expect(cache.get('0x2').has('nft1')).toBe(true)
      expect(cache.get('0x2').get('nft1')).toBe(false)
      expect(cache.get('0x2').has('nft2')).toBe(true)
      expect(cache.get('0x2').get('nft2')).toBe(false)
    })

    it("must set to true in the cache every nft that is found in both maps, and to false the ones that are not in the ownership map", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      
      const checkedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']],
        ['0x2', ['nft1', 'nft2']]
      ])
      const ownedNFTsByAddress = new Map([
        ['0x1', ['nft1']],
        ['0x2', ['nft2']]
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, ownedNFTsByAddress, cache)

      expect(Array.from(cache.keys()).length).toEqual(2)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(true)
      expect(cache.get('0x1').has('nft2')).toBe(true)
      expect(cache.get('0x1').get('nft2')).toBe(false)
      expect(cache.has('0x2')).toBe(true)
      expect(cache.get('0x2').has('nft1')).toBe(true)
      expect(cache.get('0x2').get('nft1')).toBe(false)
      expect(cache.get('0x2').has('nft2')).toBe(true)
      expect(cache.get('0x2').get('nft2')).toBe(true)
    })

    it("must not alter values from other existing addresses in the cache", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x3', new Map([['nft3', true]]))

      const checkedNFTsByAddress = new Map([
        ['0x1', ['nft1', 'nft2']],
        ['0x2', ['nft1', 'nft2']]
      ])
      const ownedNFTsByAddress = new Map([
        ['0x1', ['nft1']],
        ['0x2', ['nft2']]
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, ownedNFTsByAddress, cache)

      expect(Array.from(cache.keys()).length).toEqual(3)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(true)
      expect(cache.get('0x1').has('nft2')).toBe(true)
      expect(cache.get('0x1').get('nft2')).toBe(false)
      expect(cache.has('0x2')).toBe(true)
      expect(cache.get('0x2').has('nft1')).toBe(true)
      expect(cache.get('0x2').get('nft1')).toBe(false)
      expect(cache.get('0x2').has('nft2')).toBe(true)
      expect(cache.get('0x2').get('nft2')).toBe(true)
      expect(cache.has('0x3')).toBe(true)
      expect(cache.get('0x3').has('nft3')).toBe(true)
      expect(cache.get('0x3').get('nft3')).toBe(true)
    })

    it("must override the values of the cache if the address and nft matches", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true]]))
  
      const checkedNFTsByAddress = new Map([
        ['0x1', ['nft1']],
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, new Map(), cache)
  
      expect(Array.from(cache.keys()).length).toEqual(1)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(false)
      
    })

    it("must not override the values if the address and nft matches doesn't match", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true]]))
  
      const checkedNFTsByAddress = new Map([
        ['0x2', ['nft1']],
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, new Map(), cache)
  
      expect(Array.from(cache.keys()).length).toEqual(2)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(true)
      expect(cache.has('0x2')).toBe(true)
      expect(cache.get('0x2').has('nft1')).toBe(true)
      expect(cache.get('0x2').get('nft1')).toBe(false)
    })

    it("must not override the values if the address matches but the nfts doesn't, it should add them", async () => {
      const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
      cache.set('0x1', new Map([['nft1', true]]))
  
      const checkedNFTsByAddress = new Map([
        ['0x1', ['nft2']],
      ])
      fillCacheWithRecentlyCheckedWearables(checkedNFTsByAddress, new Map(), cache)
  
      expect(Array.from(cache.keys()).length).toEqual(1)
      expect(cache.has('0x1')).toBe(true)
      expect(cache.get('0x1').has('nft1')).toBe(true)
      expect(cache.get('0x1').get('nft1')).toBe(true)
      expect(cache.get('0x1').has('nft2')).toBe(true)
      expect(cache.get('0x1').get('nft2')).toBe(false)
    })
  })
})
