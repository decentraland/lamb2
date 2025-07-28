import { ILoggerComponent } from '@well-known-components/interfaces'
import {
  fetchWithSmartPagination,
  fetchWearablesWithSmartPagination,
  fetchEmotesWithSmartPagination,
  fetchNamesWithSmartPagination
} from '../../../../src/logic/fetch-elements/smart-pagination-helper'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../../../src/adapters/marketplace-types'
import { OnChainWearable, OnChainEmote, Name } from '../../../../src/types'
import { IMarketplaceApiFetcher } from '../../../../src/adapters/marketplace-api-fetcher'

// Mock logger
const mockLogger: ILoggerComponent.ILogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
}

// Sample test data
const sampleProfileWearables: ProfileWearable[] = [
  {
    urn: 'urn:decentraland:ethereum:collections-v1:test:wearable1',
    id: '1',
    tokenId: '1',
    category: 'hat' as any,
    transferredAt: 1000,
    name: 'Test Hat 1',
    rarity: 'common',
    price: 100,
    individualData: [{ id: '1:1', tokenId: '1', transferredAt: 1000, price: 100 }],
    amount: 1,
    minTransferredAt: 1000,
    maxTransferredAt: 1000
  },
  {
    urn: 'urn:decentraland:ethereum:collections-v1:test:wearable1',
    id: '2',
    tokenId: '2',
    category: 'hat' as any,
    transferredAt: 1100,
    name: 'Test Hat 1',
    rarity: 'common',
    price: 100,
    individualData: [{ id: '1:2', tokenId: '2', transferredAt: 1100, price: 100 }],
    amount: 1,
    minTransferredAt: 1100,
    maxTransferredAt: 1100
  },
  {
    urn: 'urn:decentraland:ethereum:collections-v1:test:wearable2',
    id: '3',
    tokenId: '1',
    category: 'upper_body' as any,
    transferredAt: 1200,
    name: 'Test Upper Body',
    rarity: 'rare',
    price: 200,
    individualData: [{ id: '2:1', tokenId: '1', transferredAt: 1200, price: 200 }],
    amount: 1,
    minTransferredAt: 1200,
    maxTransferredAt: 1200
  }
]

describe('Smart Pagination Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchWithSmartPagination', () => {
    it('should fetch exactly the requested number of unique elements when available', async () => {
      // Mock fetcher that returns raw data (with duplicates)
      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: sampleProfileWearables, // 3 items, but 2 unique URNs
        total: 100,
        totalItems: 50
      })

      // Mock transformer that groups by URN (like fromProfileWearablesToOnChainWearables)
      const mockTransformer = jest.fn().mockReturnValue([
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test:wearable1',
          amount: 2,
          individualData: [
            { id: '1:1', tokenId: '1', transferredAt: 1000, price: 100 },
            { id: '1:2', tokenId: '2', transferredAt: 1100, price: 100 }
          ],
          name: 'Test Hat 1',
          category: 'hat',
          rarity: 'common',
          minTransferredAt: 1000,
          maxTransferredAt: 1100
        },
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test:wearable2',
          amount: 1,
          individualData: [{ id: '2:1', tokenId: '1', transferredAt: 1200, price: 200 }],
          name: 'Test Upper Body',
          category: 'upper_body',
          rarity: 'rare',
          minTransferredAt: 1200,
          maxTransferredAt: 1200
        }
      ])

      const result = await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        2, // target page size
        0, // offset
        mockLogger
      )

      expect(result.elements).toHaveLength(2)
      expect(result.totalAmount).toBe(50) // totalItems from marketplace-api
      expect(result.totalUniqueItems).toBe(50)
      expect(result.pagesProcessed).toBe(1)
      expect(mockFetcher).toHaveBeenCalledTimes(1)
      expect(mockFetcher).toHaveBeenCalledWith(200, 0) // Math.max(2 * 2, 200) = 200
    })

    it('should fetch multiple pages when first page does not have enough unique elements', async () => {
      // Create full page data (200 items) to simulate proper pagination
      const fullPageData1 = Array(200)
        .fill(null)
        .map((_, i) => ({
          urn: i < 100 ? 'urn:test:wearable1' : 'urn:test:wearable2',
          id: i.toString(),
          tokenId: i.toString(),
          category: 'hat' as any,
          transferredAt: 1000 + i,
          name: i < 100 ? 'Test 1' : 'Test 2',
          rarity: 'common',
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1000 + i,
          maxTransferredAt: 1000 + i
        }))

      const fullPageData2 = Array(200)
        .fill(null)
        .map((_, i) => ({
          urn: i < 100 ? 'urn:test:wearable3' : 'urn:test:wearable4',
          id: (i + 200).toString(),
          tokenId: (i + 200).toString(),
          category: 'feet' as any,
          transferredAt: 1300 + i,
          name: i < 100 ? 'Test 3' : 'Test 4',
          rarity: 'epic',
          price: 300,
          individualData: [],
          amount: 1,
          minTransferredAt: 1300 + i,
          maxTransferredAt: 1300 + i
        }))

      const mockFetcher = jest
        .fn()
        // First page: full page (200 items) but only 2 unique
        .mockResolvedValueOnce({
          data: fullPageData1,
          total: 400,
          totalItems: 200
        })
        // Second page: full page (200 items) with 2 more unique
        .mockResolvedValueOnce({
          data: fullPageData2,
          total: 400,
          totalItems: 200
        })

      const mockTransformer = jest
        .fn()
        .mockReturnValueOnce([
          { urn: 'wearable1', name: 'Test 1' },
          { urn: 'wearable2', name: 'Test 2' }
        ])
        .mockReturnValueOnce([
          { urn: 'wearable3', name: 'Test 3' },
          { urn: 'wearable4', name: 'Test 4' }
        ])

      const result = await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        4, // need 4 unique elements
        0,
        mockLogger
      )

      expect(result.elements).toHaveLength(4)
      expect(result.pagesProcessed).toBe(2)
      expect(mockFetcher).toHaveBeenCalledTimes(2)
      expect(mockFetcher).toHaveBeenNthCalledWith(1, 200, 0) // Math.max(4 * 2, 200) = 200
      expect(mockFetcher).toHaveBeenNthCalledWith(2, 200, 200) // next page
    })

    it('should handle offset correctly by skipping elements', async () => {
      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: sampleProfileWearables,
        total: 100,
        totalItems: 50
      })

      const mockTransformer = jest.fn().mockReturnValue([
        { urn: 'wearable1', name: 'Test 1' },
        { urn: 'wearable2', name: 'Test 2' },
        { urn: 'wearable3', name: 'Test 3' }
      ])

      const result = await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        2, // page size
        1, // offset: skip first element
        mockLogger
      )

      expect(result.elements).toHaveLength(2)
      expect(result.elements[0]).toEqual({ urn: 'wearable2', name: 'Test 2' })
      expect(result.elements[1]).toEqual({ urn: 'wearable3', name: 'Test 3' })
    })

    it('should stop when no more pages are available', async () => {
      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: [sampleProfileWearables[0]], // Only 1 item (less than apiPageSize of 200)
        total: 1,
        totalItems: 1
      })

      const mockTransformer = jest.fn().mockReturnValueOnce([{ urn: 'wearable1', name: 'Test 1' }])

      const result = await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        5, // want 5 but only 1 available
        0,
        mockLogger
      )

      expect(result.elements).toHaveLength(1)
      expect(result.pagesProcessed).toBe(1) // Only made one call because first page had < apiPageSize items
    })

    it('should handle empty response gracefully', async () => {
      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: [],
        total: 0,
        totalItems: 0
      })

      const mockTransformer = jest.fn().mockReturnValue([])

      const result = await fetchWithSmartPagination(mockFetcher, mockTransformer, 10, 0, mockLogger)

      expect(result.elements).toHaveLength(0)
      expect(result.totalAmount).toBe(0)
      expect(result.pagesProcessed).toBe(1)
    })

    it('should handle errors from fetcher', async () => {
      const mockFetcher = jest.fn().mockRejectedValueOnce(new Error('API Error'))

      const mockTransformer = jest.fn()

      await expect(fetchWithSmartPagination(mockFetcher, mockTransformer, 10, 0, mockLogger)).rejects.toThrow(
        'API Error'
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during smart pagination',
        expect.objectContaining({
          error: 'API Error'
        })
      )
    })

    it('should deduplicate elements correctly based on URN', async () => {
      const duplicateData = [
        {
          urn: 'same-urn',
          id: '1',
          tokenId: '1',
          category: 'hat' as any,
          transferredAt: 1000,
          name: 'Test',
          rarity: 'common',
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1000,
          maxTransferredAt: 1000
        },
        {
          urn: 'same-urn', // Same URN
          id: '2',
          tokenId: '2',
          category: 'hat' as any,
          transferredAt: 1100,
          name: 'Test',
          rarity: 'common',
          price: 100,
          individualData: [],
          amount: 1,
          minTransferredAt: 1100,
          maxTransferredAt: 1100
        }
      ]

      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: duplicateData,
        total: 2,
        totalItems: 1
      })

      const mockTransformer = jest.fn().mockReturnValue([{ urn: 'same-urn', name: 'Test Combined', amount: 2 }])

      const result = await fetchWithSmartPagination(mockFetcher, mockTransformer, 5, 0, mockLogger)

      expect(result.elements).toHaveLength(1)
      expect((result.elements[0] as any).urn).toBe('same-urn')
    })
  })

  describe('fetchWearablesWithSmartPagination', () => {
    it('should call marketplace API and transform wearables correctly', async () => {
      const mockMarketplaceApi: Partial<IMarketplaceApiFetcher> = {
        getWearablesByOwner: jest.fn().mockResolvedValue({
          data: sampleProfileWearables,
          total: 100,
          totalItems: 50
        })
      }

      const result = await fetchWearablesWithSmartPagination(
        mockMarketplaceApi as IMarketplaceApiFetcher,
        '0xtest',
        2,
        0,
        mockLogger
      )

      expect(mockMarketplaceApi.getWearablesByOwner).toHaveBeenCalledWith(
        '0xtest',
        200, // Math.max(2 * 2, 200) = 200
        0
      )
      expect(result.elements).toHaveLength(2) // 2 unique wearables after transformation
      expect(result.elements[0]).toHaveProperty('urn')
      expect(result.elements[0]).toHaveProperty('amount')
    })
  })

  describe('fetchEmotesWithSmartPagination', () => {
    it('should call marketplace API and transform emotes correctly', async () => {
      const sampleEmotes: ProfileEmote[] = [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:test:emote1',
          id: '1',
          tokenId: '1',
          category: 'dance' as any,
          transferredAt: 1000,
          name: 'Test Dance',
          rarity: 'common',
          price: 50,
          individualData: [{ id: '1:1', tokenId: '1', transferredAt: 1000, price: 50 }],
          amount: 1,
          minTransferredAt: 1000,
          maxTransferredAt: 1000
        }
      ]

      const mockMarketplaceApi: Partial<IMarketplaceApiFetcher> = {
        getEmotesByOwner: jest.fn().mockResolvedValue({
          data: sampleEmotes,
          total: 50,
          totalItems: 25
        })
      }

      const result = await fetchEmotesWithSmartPagination(
        mockMarketplaceApi as IMarketplaceApiFetcher,
        '0xtest',
        1,
        0,
        mockLogger
      )

      expect(mockMarketplaceApi.getEmotesByOwner).toHaveBeenCalledWith(
        '0xtest',
        200, // min 200
        0
      )
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0]).toHaveProperty('urn')
      expect(result.elements[0]).toHaveProperty('amount')
    })
  })

  describe('fetchNamesWithSmartPagination', () => {
    it('should call marketplace API for names correctly', async () => {
      const sampleNames: ProfileName[] = [
        {
          name: 'test1',
          contractAddress: '0xcontract1',
          tokenId: '1',
          price: 1000
        },
        {
          name: 'test2',
          contractAddress: '0xcontract2',
          tokenId: '2',
          price: 2000
        }
      ]

      const mockMarketplaceApi: Partial<IMarketplaceApiFetcher> = {
        getNamesByOwner: jest.fn().mockResolvedValue({
          data: sampleNames,
          total: 2,
          totalItems: 2
        })
      }

      const result = await fetchNamesWithSmartPagination(
        mockMarketplaceApi as IMarketplaceApiFetcher,
        '0xtest',
        2,
        0,
        mockLogger
      )

      expect(mockMarketplaceApi.getNamesByOwner).toHaveBeenCalledWith(
        '0xtest',
        200, // Math.max(2 * 2, 200) = 200
        0
      )
      expect(result.elements).toHaveLength(2)
      expect(result.elements[0]).toHaveProperty('name')
    })
  })

  describe('Edge cases and performance', () => {
    it('should use minimum page size of 200 for API calls', async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        data: [sampleProfileWearables[0]],
        total: 1,
        totalItems: 1
      })

      const mockTransformer = jest.fn().mockReturnValue([{ urn: 'test', name: 'Test' }])

      await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        1, // small target page size
        0,
        mockLogger
      )

      expect(mockFetcher).toHaveBeenCalledWith(200, 0) // Should use min 200
    })

    it('should use 2x target size when target is large', async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        totalItems: 0
      })

      const mockTransformer = jest.fn().mockReturnValue([])

      await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        500, // large target
        0,
        mockLogger
      )

      expect(mockFetcher).toHaveBeenCalledWith(1000, 0) // Should use 2x = 1000
    })

    it('should stop when API returns less than requested (end of pages)', async () => {
      const mockFetcher = jest.fn().mockResolvedValueOnce({
        data: Array(150)
          .fill(null)
          .map((_, i) => ({
            ...sampleProfileWearables[0],
            id: i.toString(),
            tokenId: i.toString(),
            urn: `urn:test:${i}`
          })),
        total: 1000,
        totalItems: 500
      })

      const mockTransformer = jest.fn().mockReturnValue(
        Array(150)
          .fill(null)
          .map((_, i) => ({ urn: `urn:test:${i}`, name: `Test ${i}` }))
      )

      const result = await fetchWithSmartPagination(
        mockFetcher,
        mockTransformer,
        200, // want 200, but only got 150
        0,
        mockLogger
      )

      expect(result.elements).toHaveLength(150)
      expect(result.pagesProcessed).toBe(1) // Should stop after first page
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })
  })
})
