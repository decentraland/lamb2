import { WearableCategory, EmoteCategory, Rarity } from '@dcl/schemas'
import {
  fromDbRowsToWearables,
  fromDbRowsToEmotes,
  fromDbRowsToNames,
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../../../src/ports/dapps-db/mappers'
import { DappsDbRow, ProfileWearable, ProfileEmote } from '../../../../src/ports/dapps-db/types'

describe('dapps-db mappers', () => {
  describe('fromDbRowsToWearables', () => {
    it('should convert single db row to ProfileWearable', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'test-id-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:item',
          owner: '0xuser',
          category: WearableCategory.HAT,
          rarity: Rarity.RARE,
          name: 'Test Hat',
          transferred_at: 1640995200000,
          price: 100
        }
      ]

      const result = fromDbRowsToWearables(rows)

      expect(result).toHaveLength(1)
      expect(result[0].urn).toBe('urn:decentraland:ethereum:collections-v1:test:item')
      expect(result[0].amount).toBe(1)
      expect(result[0].category).toBe(WearableCategory.HAT)
      expect(result[0].individualData).toHaveLength(1)
    })

    it('should group multiple tokens of same URN', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'test-id-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:item',
          owner: '0xuser',
          category: WearableCategory.HAT,
          transferred_at: 1640995200000
        },
        {
          id: 'test-id-2',
          contract_address: '0x123',
          token_id: '789',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:item',
          owner: '0xuser',
          category: WearableCategory.HAT,
          transferred_at: 1640995300000
        }
      ]

      const result = fromDbRowsToWearables(rows)

      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(2)
      expect(result[0].individualData).toHaveLength(2)
    })

    it('should handle empty array', () => {
      expect(fromDbRowsToWearables([])).toEqual([])
    })

    it('should use defaults when fields are missing', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'test-id-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:item',
          owner: '0xuser'
        } as DappsDbRow
      ]

      const result = fromDbRowsToWearables(rows)

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe(WearableCategory.EYEWEAR) // default
      expect(result[0].name).toBe('') // default
      expect(result[0].rarity).toBe(Rarity.COMMON) // default
      expect(result[0].price).toBeUndefined()
    })
  })

  describe('fromDbRowsToEmotes', () => {
    it('should convert db rows to emotes', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'emote-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:dance',
          owner: '0xuser',
          category: EmoteCategory.DANCE,
          name: 'Test Dance'
        }
      ]

      const result = fromDbRowsToEmotes(rows)

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe(EmoteCategory.DANCE)
      expect(result[0].name).toBe('Test Dance')
    })

    it('should handle empty array', () => {
      expect(fromDbRowsToEmotes([])).toEqual([])
    })

    it('should use default category when invalid category provided', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'emote-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:invalid',
          owner: '0xuser',
          name: 'Test Emote'
        } as DappsDbRow
      ]

      const result = fromDbRowsToEmotes(rows)

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe(EmoteCategory.DANCE) // default
    })

    it('should group multiple emotes with same URN', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'emote-1',
          contract_address: '0x123',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:dance',
          owner: '0xuser',
          category: EmoteCategory.DANCE,
          transferred_at: 1640995200000
        },
        {
          id: 'emote-2',
          contract_address: '0x123',
          token_id: '789',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:collections-v1:test:dance',
          owner: '0xuser',
          category: EmoteCategory.DANCE,
          transferred_at: 1640995300000
        }
      ]

      const result = fromDbRowsToEmotes(rows)

      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(2)
      expect(result[0].individualData).toHaveLength(2)
    })
  })

  describe('fromDbRowsToNames', () => {
    it('should convert db rows to names', () => {
      const rows: DappsDbRow[] = [
        {
          id: 'name-1',
          contract_address: '0x123abc',
          token_id: '456',
          network: 'ethereum',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          urn: 'urn:decentraland:ethereum:names:test',
          owner: '0xuser',
          category: 'name',
          name: 'testname',
          price: 100
        }
      ]

      const result = fromDbRowsToNames(rows)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('testname')
      expect(result[0].contractAddress).toBe('0x123abc')
      expect(result[0].tokenId).toBe('456')
    })

    it('should handle empty array', () => {
      expect(fromDbRowsToNames([])).toEqual([])
    })
  })

  describe('fromProfileWearablesToOnChainWearables', () => {
    it('should convert profile wearables to onchain format', () => {
      const profileWearables: ProfileWearable[] = [
        {
          urn: 'urn:test',
          id: 'test-id',
          tokenId: '456',
          category: WearableCategory.HAT,
          transferredAt: 1640995200000,
          name: 'Test Hat',
          rarity: Rarity.RARE,
          individualData: [],
          amount: 1,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000
        }
      ]

      const result = fromProfileWearablesToOnChainWearables(profileWearables)

      expect(result).toHaveLength(1)
      expect(result[0].urn).toBe('urn:test')
      expect(result[0].amount).toBe(1)
      expect(result[0].category).toBe(WearableCategory.HAT)
    })
  })

  describe('fromProfileEmotesToOnChainEmotes', () => {
    it('should convert profile emotes to onchain format', () => {
      const profileEmotes: ProfileEmote[] = [
        {
          urn: 'urn:test:emote',
          id: 'emote-id',
          tokenId: '456',
          category: EmoteCategory.DANCE,
          transferredAt: 1640995200000,
          name: 'Test Dance',
          rarity: Rarity.EPIC,
          individualData: [],
          amount: 1,
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000
        }
      ]

      const result = fromProfileEmotesToOnChainEmotes(profileEmotes)

      expect(result).toHaveLength(1)
      expect(result[0].urn).toBe('urn:test:emote')
      expect(result[0].category).toBe(EmoteCategory.DANCE)
    })
  })
})
