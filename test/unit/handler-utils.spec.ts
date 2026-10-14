import { createPaginationAndFilters, normalizeWearableFormat } from '../../src/controllers/handlers/utils'

describe('when extracting the filters of an items request', () => {
  let url: URL

  describe('and the category is not lowercase', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?category=HAT')
    })

    it('should normalise it so the cache, the marketplace API and the subgraph see the same value', () => {
      expect(createPaginationAndFilters(url, 1000).filters.category).toBe('hat')
    })
  })

  describe('and the rarity is not lowercase', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?rarity=Rare')
    })

    it('should normalise it so the marketplace exact match and the fallback agree', () => {
      expect(createPaginationAndFilters(url, 1000).filters.rarity).toBe('rare')
    })
  })
})

describe('when normalizing a subgraph wearable', () => {
  let normalized: { minTransferredAt: unknown; maxTransferredAt: unknown }

  describe('and its transferredAt is a numeric string', () => {
    beforeEach(() => {
      normalized = normalizeWearableFormat({
        urn: 'urn:a',
        tokenId: '1',
        transferredAt: '1640995200000',
        item: { rarity: 'rare', price: '0' },
        metadata: { wearable: { name: 'A', category: 'hat' } }
      })
    })

    it('should return the transfer bounds as numbers', () => {
      expect([normalized.minTransferredAt, normalized.maxTransferredAt]).toEqual([1640995200000, 1640995200000])
    })
  })

  describe('and its transferredAt is missing', () => {
    beforeEach(() => {
      normalized = normalizeWearableFormat({
        urn: 'urn:a',
        tokenId: '1',
        item: { rarity: 'rare', price: '0' },
        metadata: { wearable: { name: 'A', category: 'hat' } }
      })
    })

    it('should return 0 as the transfer bounds', () => {
      expect([normalized.minTransferredAt, normalized.maxTransferredAt]).toEqual([0, 0])
    })
  })
})
