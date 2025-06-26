import { WearableCategory, EmoteCategory, Rarity } from '@dcl/schemas'
import {
  fromDbRowsToWearables,
  fromDbRowsToEmotes,
  fromDbRowsToNames
} from '../../../../src/adapters/profiles/db-mappers'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../../../src/ports/dapps-db/types'

describe('profiles db-mappers', () => {
  describe('fromDbRowsToWearables', () => {
    it('should convert ProfileWearable array to OnChainWearable array', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'test-id-1',
          tokenId: '123',
          category: WearableCategory.FEET,
          transferredAt: 1640995200000,
          name: 'Ethermon Feet',
          rarity: Rarity.RARE,
          price: 100,
          individualData: [
            {
              id: 'individual-1',
              tokenId: '123',
              transferredAt: 1640995200000,
              price: 100
            }
          ],
          amount: 1,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000
        }
      ]

      const result = fromDbRowsToWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
        amount: 1,
        name: 'Ethermon Feet',
        rarity: Rarity.RARE,
        category: WearableCategory.FEET,
        individualData: [
          {
            id: 'individual-1',
            tokenId: '123',
            transferredAt: 1640995200000,
            price: 100
          }
        ],
        definition: null,
        minTransferredAt: 1640995200000,
        maxTransferredAt: 1640995200000
      })
    })

    it('should handle multiple wearables with multiple individual data', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test:item1',
          id: 'test-id-1',
          tokenId: '123',
          category: WearableCategory.HAT,
          transferredAt: 1640995200000,
          name: 'Test Hat',
          rarity: Rarity.COMMON,
          price: 50,
          individualData: [
            {
              id: 'individual-1',
              tokenId: '123',
              transferredAt: 1640995200000,
              price: 50
            },
            {
              id: 'individual-2',
              tokenId: '124',
              transferredAt: 1640995300000,
              price: 60
            }
          ],
          amount: 2,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995300000
        }
      ]

      const result = fromDbRowsToWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0].individualData).toHaveLength(2)
      expect(result[0].amount).toBe(2)
    })

    it('should handle empty array', () => {
      const result = fromDbRowsToWearables([])
      expect(result).toEqual([])
    })
  })

  describe('fromDbRowsToEmotes', () => {
    it('should convert ProfileEmote array to OnChainEmote array', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test_emotes:dance',
          id: 'emote-id-1',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1640995200000,
          name: 'Dance Emote',
          rarity: Rarity.EPIC,
          price: 200,
          individualData: [
            {
              id: 'individual-emote-1',
              tokenId: '456',
              transferredAt: 1640995200000,
              price: 200
            }
          ],
          amount: 1,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000
        }
      ]

      const result = fromDbRowsToEmotes(profileEmotes)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v1:test_emotes:dance',
        amount: 1,
        name: 'Dance Emote',
        rarity: Rarity.EPIC,
        category: EmoteCategory.DANCE,
        individualData: [
          {
            id: 'individual-emote-1',
            tokenId: '456',
            transferredAt: 1640995200000,
            price: 200
          }
        ],
        definition: null,
        minTransferredAt: 1640995200000,
        maxTransferredAt: 1640995200000
      })
    })

    it('should handle multiple emotes', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test_emotes:dance',
          id: 'emote-id-1',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1640995200000,
          name: 'Dance Emote',
          rarity: Rarity.EPIC,
          price: 200,
          individualData: [
            {
              id: 'individual-emote-1',
              tokenId: '456',
              transferredAt: 1640995200000,
              price: 200
            }
          ],
          amount: 1,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test_emotes:wave',
          id: 'emote-id-2',
          tokenId: '789',
          category: EmoteCategory.GREETINGS,
          transferredAt: 1640995300000,
          name: 'Wave Emote',
          rarity: Rarity.COMMON,
          price: 50,
          individualData: [
            {
              id: 'individual-emote-2',
              tokenId: '789',
              transferredAt: 1640995300000,
              price: 50
            }
          ],
          amount: 1,
          minTransferredAt: 1640995300000,
          maxTransferredAt: 1640995300000
        }
      ]

      const result = fromDbRowsToEmotes(profileEmotes)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Dance Emote')
      expect(result[1].name).toBe('Wave Emote')
    })

    it('should handle empty array', () => {
      const result = fromDbRowsToEmotes([])
      expect(result).toEqual([])
    })
  })

  describe('fromDbRowsToNames', () => {
    it('should convert ProfileName array to Name array', () => {
      const profileNames: ProfileName[] = [
        {
          name: 'testname',
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: 100
        }
      ]

      const result = fromDbRowsToNames(profileNames)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'testname',
        contractAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1'
      })
      // Price should not be included in the result
      expect(result[0]).not.toHaveProperty('price')
    })

    it('should handle multiple names', () => {
      const profileNames: ProfileName[] = [
        {
          name: 'alice',
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: 100
        },
        {
          name: 'bob',
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '2',
          price: 150
        }
      ]

      const result = fromDbRowsToNames(profileNames)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('alice')
      expect(result[0].tokenId).toBe('1')
      expect(result[1].name).toBe('bob')
      expect(result[1].tokenId).toBe('2')
    })

    it('should handle empty array', () => {
      const result = fromDbRowsToNames([])
      expect(result).toEqual([])
    })

    it('should preserve contract address and tokenId correctly', () => {
      const profileNames: ProfileName[] = [
        {
          name: 'uniquename',
          contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          tokenId: '999',
          price: 500
        }
      ]

      const result = fromDbRowsToNames(profileNames)

      expect(result[0].contractAddress).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
      expect(result[0].tokenId).toBe('999')
    })
  })
})
