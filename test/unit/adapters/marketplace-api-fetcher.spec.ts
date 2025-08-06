import { createMarketplaceApiFetcher, IMarketplaceApiFetcher } from '../../../src/adapters/marketplace-api-fetcher'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../../src/adapters/marketplace-types'
import { WearableCategory, EmoteCategory, Rarity } from '@dcl/schemas'

// Type definitions for mocks
interface MockLogger {
  debug: jest.Mock
  error: jest.Mock
  log: jest.Mock
  info: jest.Mock
  warn: jest.Mock
  severity: string
}

interface MockLoggerComponent {
  getLogger: jest.Mock<MockLogger, [string]>
}

interface MockConfigComponent {
  requireString: jest.Mock<Promise<string>, [string]>
  getString: jest.Mock<Promise<string>, [string]>
  getNumber: jest.Mock<Promise<number>, [string]>
  requireNumber: jest.Mock<Promise<number>, [string]>
}

describe('marketplace-api-fetcher', () => {
  let marketplaceApiFetcher: IMarketplaceApiFetcher
  let mockFetch: jest.Mock
  let mockConfig: MockConfigComponent
  let mockLogs: MockLoggerComponent
  let mockLogger: MockLogger

  const MARKETPLACE_API_URL = 'https://marketplace-api.decentraland.org'

  beforeEach(async () => {
    // Setup mocks
    mockFetch = jest.fn()
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      severity: 'debug'
    }
    mockLogs = {
      getLogger: jest.fn().mockReturnValue(mockLogger)
    }
    mockConfig = {
      requireString: jest.fn().mockResolvedValue(MARKETPLACE_API_URL),
      getString: jest.fn(),
      getNumber: jest.fn(),
      requireNumber: jest.fn()
    }

    // Create fetcher instance
    marketplaceApiFetcher = await createMarketplaceApiFetcher({
      fetch: { fetch: mockFetch },
      config: mockConfig,
      logs: mockLogs
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when creating marketplace API fetcher', () => {
    it('should require MARKETPLACE_API_URL from config', async () => {
      await createMarketplaceApiFetcher({
        fetch: { fetch: mockFetch },
        config: mockConfig,
        logs: mockLogs
      })

      expect(mockConfig.requireString).toHaveBeenCalledWith('MARKETPLACE_API_URL')
    })

    it('should create logger with correct name', async () => {
      await createMarketplaceApiFetcher({
        fetch: { fetch: mockFetch },
        config: mockConfig,
        logs: mockLogs
      })

      expect(mockLogs.getLogger).toHaveBeenCalledWith('marketplace-api-fetcher')
    })
  })

  describe('when fetching wearables by owner', () => {
    const mockWearableResponse = {
      ok: true,
      data: {
        elements: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:test:item',
            id: 'test-id',
            tokenId: '123',
            category: WearableCategory.UPPER_BODY,
            transferredAt: 1234567890000,
            name: 'Test Wearable',
            rarity: Rarity.COMMON,
            price: 100,
            individualData: [
              {
                id: 'test-id',
                tokenId: '123',
                transferredAt: 1234567890000,
                price: 100
              }
            ],
            amount: 1,
            minTransferredAt: 1234567890000,
            maxTransferredAt: 1234567890000
          }
        ] as ProfileWearable[],
        total: 1,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch wearables successfully with default pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWearableResponse)
      })

      const result = await marketplaceApiFetcher.getWearablesByOwner('0x123')

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/wearables?first=1000&skip=0`)
      expect(mockLogger.debug).toHaveBeenCalledWith('Making request to marketplace API', {
        url: `${MARKETPLACE_API_URL}/v1/users/0x123/wearables?first=1000&skip=0`
      })
      expect(result).toEqual({
        data: mockWearableResponse.data.elements,
        total: 1
      })
    })

    it('should fetch wearables with custom pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWearableResponse)
      })

      await marketplaceApiFetcher.getWearablesByOwner('0x123', 50, 10)

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/wearables?first=50&skip=10`)
    })

    it('should throw error when HTTP response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(marketplaceApiFetcher.getWearablesByOwner('0x123')).rejects.toThrow('HTTP 404: Not Found')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching from marketplace API',
        expect.objectContaining({
          url: `${MARKETPLACE_API_URL}/v1/users/0x123/wearables?first=1000&skip=0`,
          error: 'HTTP 404: Not Found'
        })
      )
    })

    it('should throw error when API response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            message: 'API Error'
          })
      })

      await expect(marketplaceApiFetcher.getWearablesByOwner('0x123')).rejects.toThrow('API Error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching from marketplace API',
        expect.objectContaining({
          error: 'API Error'
        })
      )
    })

    it('should throw error when API response is not ok without message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false
          })
      })

      await expect(marketplaceApiFetcher.getWearablesByOwner('0x123')).rejects.toThrow('API request failed')
    })

    it('should handle fetch network errors', async () => {
      const networkError = new Error('Network Error')
      mockFetch.mockRejectedValue(networkError)

      await expect(marketplaceApiFetcher.getWearablesByOwner('0x123')).rejects.toThrow('Network Error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching from marketplace API',
        expect.objectContaining({
          error: 'Network Error'
        })
      )
    })

    it('should handle non-Error objects thrown', async () => {
      mockFetch.mockRejectedValue('String error')

      await expect(marketplaceApiFetcher.getWearablesByOwner('0x123')).rejects.toBe('String error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching from marketplace API',
        expect.objectContaining({
          error: 'String error'
        })
      )
    })
  })

  describe('when fetching emotes by owner', () => {
    const mockEmoteResponse = {
      ok: true,
      data: {
        elements: [
          {
            urn: 'urn:decentraland:matic:collections-v1:test:emote',
            id: 'test-emote-id',
            tokenId: '456',
            category: EmoteCategory.DANCE,
            transferredAt: 1234567890000,
            name: 'Test Emote',
            rarity: Rarity.RARE,
            price: 200,
            individualData: [
              {
                id: 'test-emote-id',
                tokenId: '456',
                transferredAt: 1234567890000,
                price: 200
              }
            ],
            amount: 1,
            minTransferredAt: 1234567890000,
            maxTransferredAt: 1234567890000
          }
        ] as ProfileEmote[],
        total: 1,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch emotes successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmoteResponse)
      })

      const result = await marketplaceApiFetcher.getEmotesByOwner('0x123')

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/emotes?first=1000&skip=0`)
      expect(result).toEqual({
        data: mockEmoteResponse.data.elements,
        total: 1
      })
    })

    it('should fetch emotes with custom pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmoteResponse)
      })

      await marketplaceApiFetcher.getEmotesByOwner('0x123', 25, 5)

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/emotes?first=25&skip=5`)
    })
  })

  describe('when fetching names by owner', () => {
    const mockNameResponse = {
      ok: true,
      data: {
        elements: [
          {
            name: 'testname',
            contractAddress: '0x2a187453064356c3f3b6e5a8a5b8e4f4c45a6a67',
            tokenId: '123',
            price: 500
          }
        ] as ProfileName[],
        total: 1,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch names successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNameResponse)
      })

      const result = await marketplaceApiFetcher.getNamesByOwner('0x123')

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/names?first=1000&skip=0`)
      expect(result).toEqual({
        data: mockNameResponse.data.elements,
        total: 1
      })
    })
  })

  describe('when fetching owned wearables URN and token ID', () => {
    const mockUrnTokenResponse = {
      ok: true,
      data: {
        elements: [{ urn: 'urn:decentraland:ethereum:collections-v1:test:item', tokenId: '123' }],
        total: 1,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch wearables URN and token ID successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUrnTokenResponse)
      })

      const result = await marketplaceApiFetcher.getOwnedWearablesUrnAndTokenId('0x123')

      expect(mockFetch).toHaveBeenCalledWith(
        `${MARKETPLACE_API_URL}/v1/users/0x123/wearables/urn-token?first=1000&skip=0`
      )
      expect(result).toEqual({
        data: mockUrnTokenResponse.data.elements,
        total: 1
      })
    })
  })

  describe('when fetching owned emotes URN and token ID', () => {
    const mockUrnTokenResponse = {
      ok: true,
      data: {
        elements: [{ urn: 'urn:decentraland:matic:collections-v1:test:emote', tokenId: '456' }],
        total: 1,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch emotes URN and token ID successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUrnTokenResponse)
      })

      const result = await marketplaceApiFetcher.getOwnedEmotesUrnAndTokenId('0x123')

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/emotes/urn-token?first=1000&skip=0`)
      expect(result).toEqual({
        data: mockUrnTokenResponse.data.elements,
        total: 1
      })
    })
  })

  describe('when fetching owned names only', () => {
    const mockNamesOnlyResponse = {
      ok: true,
      data: {
        elements: ['testname1', 'testname2'],
        total: 2,
        page: 1,
        pages: 1,
        limit: 1000
      }
    }

    it('should fetch names only successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNamesOnlyResponse)
      })

      const result = await marketplaceApiFetcher.getOwnedNamesOnly('0x123')

      expect(mockFetch).toHaveBeenCalledWith(`${MARKETPLACE_API_URL}/v1/users/0x123/names/names-only?first=1000&skip=0`)
      expect(result).toEqual({
        data: mockNamesOnlyResponse.data.elements,
        total: 2
      })
    })
  })
})
