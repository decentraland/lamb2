import { getCachedNFTsAndPendingCheckNFTs } from "../../src/logic/cache"
import LRU from 'lru-cache'


describe("cache unit tests", () => {
  it("getCachedNFTsAndPendingCheckNFTs must return empty maps when empty map and cache are passed", async () => {
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(new Map(), new LRU({ max: 10, ttl: 10}))
    expect(nftsToCheckByAddress.size).toEqual(0)
    expect(cachedOwnedNFTsByAddress.size).toEqual(0)
  })
  it("getCachedNFTsAndPendingCheckNFTs must return no cached elements when the cache is empty", async () => {
    const ownedNFTsByAddress = new Map([
      ['0x1', ['nft1', 'nft2']]
    ])
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(ownedNFTsByAddress, new LRU({ max: 10, ttl: 10}))
    expect(nftsToCheckByAddress).toEqual(ownedNFTsByAddress)
    expect(cachedOwnedNFTsByAddress.size).toEqual(0)
  })

  it("getCachedNFTsAndPendingCheckNFTs must return as cached the nfts that are already cached", async () => {
    const ownedNFTsByAddress = new Map([
      ['0x1', ['nft1', 'nft2']],
      ['0x2', ['nft1', 'nft2']]
    ])
    const cache = new LRU<string, Map<string, boolean>>({ max: 10, ttl: 10})
    cache.set('0x1', new Map([['nft1', true]]))
    cache.set('0x2', new Map([['nft2', true]]))
    
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(ownedNFTsByAddress, cache)
    
    expect(nftsToCheckByAddress.size).toEqual(2)
    expect(nftsToCheckByAddress.has('0x1'))
    expect(nftsToCheckByAddress.get('0x1')).toEqual(['nft2'])
    expect(nftsToCheckByAddress.has('0x2'))
    expect(nftsToCheckByAddress.get('0x2')).toEqual(['nft1'])
    expect(cachedOwnedNFTsByAddress.size).toEqual(2)
    expect(cachedOwnedNFTsByAddress.has('0x1'))
    expect(cachedOwnedNFTsByAddress.get('0x1')).toEqual(['nft1'])
    expect(cachedOwnedNFTsByAddress.has('0x2'))
    expect(cachedOwnedNFTsByAddress.get('0x2')).toEqual(['nft2'])
  })

  it("getCachedNFTsAndPendingCheckNFTs must return ignore the nfts that are cached as false", async () => {
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
    expect(cachedOwnedNFTsByAddress.has('0x1'))
    expect(cachedOwnedNFTsByAddress.get('0x1')).toEqual(['nft1'])
    expect(cachedOwnedNFTsByAddress.has('0x2'))
    expect(cachedOwnedNFTsByAddress.get('0x2')).toEqual(['nft2'])
  })

})
