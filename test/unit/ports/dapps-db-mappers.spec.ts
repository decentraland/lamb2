import {
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../../src/ports/dapps-db/mappers'
import { createMockProfileWearable, createMockProfileEmote } from '../../mocks/dapps-db-mock'

describe('dapps-db mappers', () => {
  describe('fromProfileWearablesToOnChainWearables', () => {
    it('should convert empty array', () => {
      const result = fromProfileWearablesToOnChainWearables([])
      expect(result).toEqual([])
    })

    it('should convert single profile wearable to on-chain wearable', () => {
      const profileWearable = createMockProfileWearable({
        urn: 'urn:decentraland:matic:collections-v2:0xcontract:0',
        name: 'Test Wearable',
        category: 'upper_body' as any,
        rarity: 'common',
        amount: 1,
        individualData: [
          {
            id: 'data-1',
            tokenId: '123',
            transferredAt: 1000,
            price: 100
          }
        ],
        minTransferredAt: 1000,
        maxTransferredAt: 1000
      })

      const result = fromProfileWearablesToOnChainWearables([profileWearable])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:matic:collections-v2:0xcontract:0',
        name: 'Test Wearable',
        category: 'upper_body',
        rarity: 'common',
        amount: 1,
        individualData: [
          {
            id: 'data-1',
            tokenId: '123',
            transferredAt: 1000,
            price: 100
          }
        ],
        minTransferredAt: 1000,
        maxTransferredAt: 1000
      })
    })

    it('should convert multiple profile wearables', () => {
      const profileWearables = [
        createMockProfileWearable({
          urn: 'urn:test:1',
          name: 'Wearable 1',
          amount: 1
        }),
        createMockProfileWearable({
          urn: 'urn:test:2',
          name: 'Wearable 2',
          amount: 2
        })
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(2)
      expect(result[0].urn).toBe('urn:test:1')
      expect(result[1].urn).toBe('urn:test:2')
    })
  })

  describe('fromProfileEmotesToOnChainEmotes', () => {
    it('should convert empty array', () => {
      const result = fromProfileEmotesToOnChainEmotes([])
      expect(result).toEqual([])
    })

    it('should convert single profile emote to on-chain emote', () => {
      const profileEmote = createMockProfileEmote({
        urn: 'urn:decentraland:matic:collections-v2:0xcontract:0',
        name: 'Test Emote',
        category: 'dance' as any,
        rarity: 'rare',
        amount: 1,
        individualData: [
          {
            id: 'emote-data-1',
            tokenId: '456',
            transferredAt: 2000,
            price: 200
          }
        ],
        minTransferredAt: 2000,
        maxTransferredAt: 2000
      })

      const result = fromProfileEmotesToOnChainEmotes([profileEmote])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        urn: 'urn:decentraland:matic:collections-v2:0xcontract:0',
        name: 'Test Emote',
        category: 'dance',
        rarity: 'rare',
        amount: 1,
        individualData: [
          {
            id: 'emote-data-1',
            tokenId: '456',
            transferredAt: 2000,
            price: 200
          }
        ],
        minTransferredAt: 2000,
        maxTransferredAt: 2000
      })
    })

    it('should convert multiple profile emotes', () => {
      const profileEmotes = [
        createMockProfileEmote({
          urn: 'urn:test:emote:1',
          name: 'Emote 1'
        }),
        createMockProfileEmote({
          urn: 'urn:test:emote:2',
          name: 'Emote 2'
        })
      ]

      const result = fromProfileEmotesToOnChainEmotes(profileEmotes)

      expect(result).toHaveLength(2)
      expect(result[0].urn).toBe('urn:test:emote:1')
      expect(result[1].urn).toBe('urn:test:emote:2')
    })
  })
})
