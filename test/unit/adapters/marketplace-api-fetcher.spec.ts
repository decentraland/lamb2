import { ILoggerComponent, IConfigComponent, IFetchComponent } from '@well-known-components/interfaces'
import { WearableCategory, EmoteCategory, Rarity } from '@dcl/schemas'
import {
  createMarketplaceApiFetcher,
  IMarketplaceApiFetcher,
  MARKETPLACE_API_BATCH_SIZE,
  MarketplaceApiResponse
} from '../../../src/adapters/marketplace-api-fetcher'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../../src/adapters/marketplace-types'

describe('marketplace-api-fetcher', () => {
  let mockLogger: any
  let mockLoggerComponent: jest.Mocked<ILoggerComponent>
  let mockConfig: jest.Mocked<IConfigComponent>
  let mockFetch: jest.Mocked<IFetchComponent>
  let marketplaceApiFetcher: IMarketplaceApiFetcher

  const mockMarketplaceApiUrl = 'https://marketplace-api.decentraland.org'

  beforeEach(async () => {
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      log: jest.fn()
    }

    mockLoggerComponent = {
      getLogger: jest.fn(() => mockLogger)
    } as any

    mockConfig = {
      requireString: jest.fn().mockResolvedValue(mockMarketplaceApiUrl)
    } as any

    mockFetch = {
      fetch: jest.fn()
    } as any

    marketplaceApiFetcher = await createMarketplaceApiFetcher({
      logs: mockLoggerComponent,
      config: mockConfig,
      fetch: mockFetch
    })

    jest.clearAllMocks()
  })

  describe('getAllWearablesByOwner', () => {
    it('should fetch all wearables across multiple pages', async () => {
      const mockWearable: ProfileWearable = {
        id: 'test-id',
        urn: 'urn:decentraland:ethereum:collections-v1:test:item',
        tokenId: '123',
        category: WearableCategory.UPPER_BODY,
        transferredAt: 1234567890000,
        name: 'Test Wearable',
        rarity: Rarity.COMMON,
        price: 100,
        individualData: [],
        amount: 1,
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      }

      // Mock responses for 3 pages
      const mockResponses: MarketplaceApiResponse<ProfileWearable>[] = [
        {
          ok: true,
          data: {
            elements: [mockWearable, { ...mockWearable, id: 'test-id-2', tokenId: '124' }],
            total: 5,
            page: 1,
            pages: 3,
            limit: 2
          }
        },
        {
          ok: true,
          data: {
            elements: [
              { ...mockWearable, id: 'test-id-3', tokenId: '125' },
              { ...mockWearable, id: 'test-id-4', tokenId: '126' }
            ],
            total: 5,
            page: 2,
            pages: 3,
            limit: 2
          }
        },
        {
          ok: true,
          data: {
            elements: [{ ...mockWearable, id: 'test-id-5', tokenId: '127' }],
            total: 5,
            page: 3,
            pages: 3,
            limit: 2
          }
        }
      ]

      // Mock fetch to return different responses for each page
      mockFetch.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses[0])
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses[1])
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses[2])
        } as any)

      const result = await marketplaceApiFetcher.getAllWearablesByOwner('0x123')

      expect(result).toHaveLength(5)
      expect(result[0].id).toBe('test-id')
      expect(result[1].id).toBe('test-id-2')
      expect(result[2].id).toBe('test-id-3')
      expect(result[3].id).toBe('test-id-4')
      expect(result[4].id).toBe('test-id-5')

      // Should have made 3 fetch calls (one per page)
      expect(mockFetch.fetch).toHaveBeenCalledTimes(3)

      // Verify URLs include correct pagination parameters
      expect(mockFetch.fetch).toHaveBeenNthCalledWith(
        1,
        `${mockMarketplaceApiUrl}/v1/users/0x123/wearables?first=${MARKETPLACE_API_BATCH_SIZE}&skip=0`,
        expect.any(Object)
      )
      expect(mockFetch.fetch).toHaveBeenNthCalledWith(
        2,
        `${mockMarketplaceApiUrl}/v1/users/0x123/wearables?first=${MARKETPLACE_API_BATCH_SIZE}&skip=${MARKETPLACE_API_BATCH_SIZE}`,
        expect.any(Object)
      )
      expect(mockFetch.fetch).toHaveBeenNthCalledWith(
        3,
        `${mockMarketplaceApiUrl}/v1/users/0x123/wearables?first=${MARKETPLACE_API_BATCH_SIZE}&skip=${2 * MARKETPLACE_API_BATCH_SIZE}`,
        expect.any(Object)
      )
    })

    it('should handle empty results', async () => {
      const mockResponse: MarketplaceApiResponse<ProfileWearable> = {
        ok: true,
        data: {
          elements: [],
          total: 0,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        }
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      const result = await marketplaceApiFetcher.getAllWearablesByOwner('0x123')

      expect(result).toHaveLength(0)
      expect(mockFetch.fetch).toHaveBeenCalledTimes(1)
    })

    it('should stop when reaching last page', async () => {
      const mockWearable: ProfileWearable = {
        id: 'test-id',
        urn: 'urn:decentraland:ethereum:collections-v1:test:item',
        tokenId: '123',
        category: WearableCategory.UPPER_BODY,
        transferredAt: 1234567890000,
        name: 'Test Wearable',
        rarity: Rarity.COMMON,
        price: 100,
        individualData: [],
        amount: 1,
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      }

      // Mock response with only 1 page
      const mockResponse: MarketplaceApiResponse<ProfileWearable> = {
        ok: true,
        data: {
          elements: [mockWearable],
          total: 1,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        }
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      const result = await marketplaceApiFetcher.getAllWearablesByOwner('0x123')

      expect(result).toHaveLength(1)
      expect(mockFetch.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors', async () => {
      mockFetch.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as any)

      await expect(marketplaceApiFetcher.getAllWearablesByOwner('0x123')).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      )
    })

    it('should handle API response with ok: false', async () => {
      const mockResponse: MarketplaceApiResponse<ProfileWearable> = {
        ok: false,
        data: {
          elements: [],
          total: 0,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        },
        message: 'User not found'
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      await expect(marketplaceApiFetcher.getAllWearablesByOwner('0x123')).rejects.toThrow('User not found')
    })

    it('should log pagination progress', async () => {
      const mockWearable: ProfileWearable = {
        id: 'test-id',
        urn: 'urn:decentraland:ethereum:collections-v1:test:item',
        tokenId: '123',
        category: WearableCategory.UPPER_BODY,
        transferredAt: 1234567890000,
        name: 'Test Wearable',
        rarity: Rarity.COMMON,
        price: 100,
        individualData: [],
        amount: 1,
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      }

      const mockResponse: MarketplaceApiResponse<ProfileWearable> = {
        ok: true,
        data: {
          elements: [mockWearable],
          total: 1,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        }
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      await marketplaceApiFetcher.getAllWearablesByOwner('0x123')

      expect(mockLogger.debug).toHaveBeenCalledWith('Starting paginated fetch from marketplace API', {
        endpoint: '/v1/users/0x123/wearables',
        address: '0x123'
      })

      expect(mockLogger.debug).toHaveBeenCalledWith('Fetched page from marketplace API', {
        endpoint: '/v1/users/0x123/wearables',
        address: '0x123',
        page: 1,
        pages: 1,
        elementsThisPage: 1,
        totalElementsSoFar: 1,
        total: 1
      })

      expect(mockLogger.debug).toHaveBeenCalledWith('Completed paginated fetch from marketplace API', {
        endpoint: '/v1/users/0x123/wearables',
        address: '0x123',
        totalElements: 1,
        totalPages: 1
      })
    })
  })

  describe('getAllEmotesByOwner', () => {
    it('should fetch all emotes across multiple pages', async () => {
      const mockEmote: ProfileEmote = {
        id: 'test-emote-id',
        urn: 'urn:decentraland:matic:collections-v1:test:emote',
        tokenId: '456',
        category: EmoteCategory.DANCE,
        transferredAt: 1234567890000,
        name: 'Test Emote',
        rarity: Rarity.RARE,
        price: 200,
        individualData: [],
        amount: 1,
        minTransferredAt: 1234567890000,
        maxTransferredAt: 1234567890000
      }

      const mockResponse: MarketplaceApiResponse<ProfileEmote> = {
        ok: true,
        data: {
          elements: [mockEmote, { ...mockEmote, id: 'test-emote-id-2', tokenId: '457' }],
          total: 2,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        }
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      const result = await marketplaceApiFetcher.getAllEmotesByOwner('0x123')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('test-emote-id')
      expect(result[1].id).toBe('test-emote-id-2')
    })
  })

  describe('getAllNamesByOwner', () => {
    it('should fetch all names across multiple pages', async () => {
      const mockName: ProfileName = {
        name: 'testname.dcl.eth',
        contractAddress: '0x123abc',
        tokenId: '123',
        price: 500
      }

      const mockResponse: MarketplaceApiResponse<ProfileName> = {
        ok: true,
        data: {
          elements: [mockName, { ...mockName, name: 'testname2.dcl.eth', tokenId: '124' }],
          total: 2,
          page: 1,
          pages: 1,
          limit: MARKETPLACE_API_BATCH_SIZE
        }
      }

      mockFetch.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any)

      const result = await marketplaceApiFetcher.getAllNamesByOwner('0x123')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('testname.dcl.eth')
      expect(result[1].name).toBe('testname2.dcl.eth')
    })
  })

  describe('MARKETPLACE_API_BATCH_SIZE', () => {
    it('should use the correct batch size', () => {
      expect(MARKETPLACE_API_BATCH_SIZE).toBe(1000)
    })
  })
})
