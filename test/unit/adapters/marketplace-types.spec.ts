import { WearableCategory, EmoteCategory, Rarity } from '@dcl/schemas'
import {
  ProfileWearable,
  ProfileEmote,
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../../src/adapters/marketplace-types'
import { OnChainWearable, OnChainEmote } from '../../../src/types'

describe('marketplace-types', () => {
  describe('fromProfileWearablesToOnChainWearables', () => {
    it('should map a single wearable correctly', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [], // This will be reconstructed
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
        name: 'Ethermon Feet',
        category: WearableCategory.FEET,
        rarity: Rarity.COMMON,
        amount: 1,
        individualData: [
          {
            id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
            tokenId: '123',
            transferredAt: 1234567890000,
            price: 100
          }
        ],
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      } as OnChainWearable)
    })

    it('should group multiple wearables with same URN', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id-1',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id-2',
          tokenId: '456',
          category: WearableCategory.FEET,
          transferredAt: 1234567895000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 150,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567895000,
          maxTransferredAt: 1234567895000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
        name: 'Ethermon Feet',
        category: WearableCategory.FEET,
        rarity: Rarity.COMMON,
        amount: 2,
        individualData: [
          {
            id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
            tokenId: '123',
            transferredAt: 1234567890000,
            price: 100
          },
          {
            id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:456',
            tokenId: '456',
            transferredAt: 1234567895000,
            price: 150
          }
        ],
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567895000
      } as OnChainWearable)
    })

    it('should handle wearables with undefined price', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: undefined,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0].individualData[0].price).toBe(0)
    })

    it('should sort wearables by rarity', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:common_wearable',
          id: 'test-id-1',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Common Wearable',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:rare_wearable',
          id: 'test-id-2',
          tokenId: '456',
          category: WearableCategory.UPPER_BODY,
          transferredAt: 1234567890000,
          name: 'Rare Wearable',
          rarity: Rarity.RARE,
          price: 200,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:unique_wearable',
          id: 'test-id-3',
          tokenId: '789',
          category: WearableCategory.LOWER_BODY,
          transferredAt: 1234567890000,
          name: 'Unique Wearable',
          rarity: Rarity.UNIQUE,
          price: 300,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(3)
      expect(result[0].rarity).toBe(Rarity.UNIQUE)
      expect(result[1].rarity).toBe(Rarity.RARE)
      expect(result[2].rarity).toBe(Rarity.COMMON)
    })
  })

  describe('fromProfileEmotesToOnChainEmotes', () => {
    it('should map a single emote correctly', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
          id: 'test-emote-id',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1234567890000,
          name: 'Dance Emote',
          rarity: Rarity.RARE,
          price: 200,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileEmotesToOnChainEmotes(profileEmotes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
        name: 'Dance Emote',
        category: EmoteCategory.DANCE,
        rarity: Rarity.RARE,
        amount: 1,
        individualData: [
          {
            id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
            tokenId: '456',
            transferredAt: 1234567890000,
            price: 200
          }
        ],
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      } as OnChainEmote)
    })

    it('should group multiple emotes with same URN', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
          id: 'test-emote-id-1',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1234567890000,
          name: 'Dance Emote',
          rarity: Rarity.RARE,
          price: 200,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
          id: 'test-emote-id-2',
          tokenId: '789',
          category: EmoteCategory.DANCE,
          transferredAt: 1234567895000,
          name: 'Dance Emote',
          rarity: Rarity.RARE,
          price: 250,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567895000,
          maxTransferredAt: 1234567895000
        }
      ]

      const result = fromProfileEmotesToOnChainEmotes(profileEmotes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
        name: 'Dance Emote',
        category: EmoteCategory.DANCE,
        rarity: Rarity.RARE,
        amount: 2,
        individualData: [
          {
            id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
            tokenId: '456',
            transferredAt: 1234567890000,
            price: 200
          },
          {
            id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:789',
            tokenId: '789',
            transferredAt: 1234567895000,
            price: 250
          }
        ],
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567895000
      } as OnChainEmote)
    })

    it('should sort emotes by rarity', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:matic:collections-v1:common_emote',
          id: 'test-emote-id-1',
          tokenId: '123',
          category: EmoteCategory.FUN,
          transferredAt: 1234567890000,
          name: 'Common Emote',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:matic:collections-v1:unique_emote',
          id: 'test-emote-id-2',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1234567890000,
          name: 'Unique Emote',
          rarity: Rarity.UNIQUE,
          price: 300,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileEmotesToOnChainEmotes(profileEmotes)

      expect(result).toHaveLength(2)
      expect(result[0].rarity).toBe(Rarity.UNIQUE)
      expect(result[1].rarity).toBe(Rarity.COMMON)
    })
  })

  describe('data consistency', () => {
    it('should produce the same structure as groupItemsByURN from TheGraph', () => {
      // This test ensures the marketplace-api grouping produces the same structure as TheGraph
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id-1',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id-2',
          tokenId: '456',
          category: WearableCategory.FEET,
          transferredAt: 1234567895000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 150,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567895000,
          maxTransferredAt: 1234567895000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      // Check structure matches what groupItemsByURN would produce
      expect(result[0]).toHaveProperty('urn')
      expect(result[0]).toHaveProperty('amount')
      expect(result[0]).toHaveProperty('individualData')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('rarity')
      expect(result[0]).toHaveProperty('minTransferredAt')
      expect(result[0]).toHaveProperty('maxTransferredAt')

      // Check individualData structure
      expect(result[0].individualData).toHaveLength(2)
      expect(result[0].individualData[0]).toHaveProperty('id')
      expect(result[0].individualData[0]).toHaveProperty('tokenId')
      expect(result[0].individualData[0]).toHaveProperty('transferredAt')
      expect(result[0].individualData[0]).toHaveProperty('price')

      // Check grouping logic
      expect(result[0].amount).toBe(2)
      expect(result[0].minTransferredAt).toBe(1234567890000)
      expect(result[0].maxTransferredAt).toBe(1234567895000)
    })

    it('should ensure individualData ID format matches TheGraph pattern', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1234567890000,
          name: 'Ethermon Feet',
          rarity: Rarity.COMMON,
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567890000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      // Check that the ID format matches TheGraph's format: "urn:tokenId"
      expect(result[0].individualData[0].id).toBe(
        'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123'
      )
    })
  })
})
