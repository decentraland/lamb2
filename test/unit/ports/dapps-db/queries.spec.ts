import {
  getWearablesByOwnerQuery,
  getOwnedWearablesUrnAndTokenIdQuery,
  getEmotesByOwnerQuery,
  getOwnedEmotesUrnAndTokenIdQuery,
  getNamesByOwnerQuery,
  getOwnedNamesOnlyQuery
} from '../../../../src/ports/dapps-db/queries'

describe('dapps-db queries', () => {
  const testOwner = '0x1234567890123456789012345678901234567890'
  const testLimit = 100

  describe('getWearablesByOwnerQuery', () => {
    it('should create a query with owner and limit parameters', () => {
      const query = getWearablesByOwnerQuery(testOwner, testLimit)

      expect(query.sql).toContain('SELECT')
      expect(query.sql).toContain('FROM squid_marketplace.nft')
      expect(query.sql).toContain('WHERE owner_address = ?')
      expect(query.sql).toContain('LIMIT ?')
      expect(query.sql).toContain("IN ('wearable_v1', 'wearable_v2', 'smart_wearable_v1')")
      expect(query.values).toEqual([testOwner, testLimit])
    })

    it('should include all required wearable fields', () => {
      const query = getWearablesByOwnerQuery(testOwner, testLimit)

      expect(query.sql).toContain('nft.id')
      expect(query.sql).toContain('nft.contract_address')
      expect(query.sql).toContain('nft.token_id')
      expect(query.sql).toContain('wearable.rarity')
      expect(query.sql).toContain('wearable.name')
    })
  })

  describe('getOwnedWearablesUrnAndTokenIdQuery', () => {
    it('should create a minimal query with only urn and token_id', () => {
      const query = getOwnedWearablesUrnAndTokenIdQuery(testOwner, testLimit)

      expect(query.sql).toContain('SELECT')
      expect(query.sql).toContain('nft.urn')
      expect(query.sql).toContain('nft.token_id')
      expect(query.sql).toContain('WHERE owner_address = ?')
      expect(query.sql).toContain('LIMIT ?')
      expect(query.values).toEqual([testOwner, testLimit])
    })

    it('should not include metadata fields', () => {
      const query = getOwnedWearablesUrnAndTokenIdQuery(testOwner, testLimit)

      expect(query.sql).not.toContain('wearable.name')
      expect(query.sql).not.toContain('wearable.rarity')
      expect(query.sql).not.toContain('metadata')
    })
  })

  describe('getEmotesByOwnerQuery', () => {
    it('should create a query for emotes', () => {
      const query = getEmotesByOwnerQuery(testOwner, testLimit)

      expect(query.sql).toContain('FROM squid_marketplace.nft')
      expect(query.sql).toContain('LEFT JOIN squid_marketplace.emote')
      expect(query.sql).toContain("item_type = 'emote_v1'")
      expect(query.sql).toContain('emote.rarity')
      expect(query.sql).toContain('emote.name')
      expect(query.values).toEqual([testOwner, testLimit])
    })
  })

  describe('getOwnedEmotesUrnAndTokenIdQuery', () => {
    it('should create a minimal emotes query', () => {
      const query = getOwnedEmotesUrnAndTokenIdQuery(testOwner, testLimit)

      expect(query.sql).toContain('nft.urn')
      expect(query.sql).toContain('nft.token_id')
      expect(query.sql).toContain("item_type = 'emote_v1'")
      expect(query.sql).not.toContain('emote.name')
      expect(query.values).toEqual([testOwner, testLimit])
    })
  })

  describe('getNamesByOwnerQuery', () => {
    it('should create a query for names with lowercase owner', () => {
      const upperCaseOwner = '0X1234567890123456789012345678901234567890'
      const query = getNamesByOwnerQuery(upperCaseOwner, testLimit)

      expect(query.sql).toContain('LEFT JOIN squid_marketplace.ens')
      expect(query.sql).toContain('ens.subdomain as name')
      expect(query.sql).toContain("category = 'ens'")
      expect(query.values).toEqual([upperCaseOwner.toLowerCase(), testLimit])
    })

    it('should handle already lowercase owner', () => {
      const query = getNamesByOwnerQuery(testOwner, testLimit)

      expect(query.values).toEqual([testOwner, testLimit])
    })
  })

  describe('getOwnedNamesOnlyQuery', () => {
    it('should create a minimal names query', () => {
      const query = getOwnedNamesOnlyQuery(testOwner, testLimit)

      expect(query.sql).toContain('ens.subdomain as name')
      expect(query.sql).toContain("category = 'ens'")
      expect(query.sql).not.toContain('nft.contract_address')
      expect(query.sql).not.toContain('nft.token_id')
      expect(query.values).toEqual([testOwner, testLimit])
    })

    it('should lowercase owner address', () => {
      const upperCaseOwner = '0X1234567890123456789012345678901234567890'
      const query = getOwnedNamesOnlyQuery(upperCaseOwner, testLimit)

      expect(query.values).toEqual([upperCaseOwner.toLowerCase(), testLimit])
    })
  })
})
