import { createLogComponent } from '@well-known-components/logger'
import { IFetchComponent } from '@well-known-components/interfaces'
import { createMarketplaceApiFetcher, MarketplaceApiError } from '../../../src/adapters/marketplace-api-fetcher'
import { WearableCategory, EmoteCategory } from '@dcl/schemas'

describe('MarketplaceApiFetcher', () => {
  let mockConfig: any
  let mockFetch: IFetchComponent
  let logs: any

  beforeEach(async () => {
    logs = await createLogComponent({})

    mockConfig = {
      getString: jest.fn().mockResolvedValue('https://marketplace-api.com')
    }

    mockFetch = {
      fetch: jest.fn()
    }
  })

  describe('createMarketplaceApiFetcher', () => {
    it('should throw error when MARKETPLACE_API_URL is not configured', async () => {
      mockConfig.getString.mockResolvedValue(undefined)

      await expect(createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })).rejects.toThrow(
        'MARKETPLACE_API_URL configuration is required'
      )
    })

    it('should create fetcher successfully with valid config', async () => {
      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })

      expect(fetcher).toBeDefined()
      expect(typeof fetcher.fetchUserWearables).toBe('function')
      expect(typeof fetcher.fetchUserEmotes).toBe('function')
      expect(typeof fetcher.fetchUserNames).toBe('function')
    })
  })

  describe('fetchUserWearables', () => {
    it('should fetch and transform wearables successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {
          elements: [
            {
              urn: 'urn:decentraland:ethereum:collections-v2:0x123:1',
              amount: 2,
              individualData: [
                {
                  id: 'id1',
                  tokenId: '1',
                  transferredAt: '1640995200000',
                  price: '100.5'
                },
                {
                  id: 'id2',
                  tokenId: '2',
                  transferredAt: '1640995300000',
                  price: '200.75'
                }
              ],
              name: 'Cool Hat',
              rarity: 'epic',
              minTransferredAt: 1640995200000,
              maxTransferredAt: 1640995300000,
              category: WearableCategory.HAT
            }
          ],
          page: 1,
          pages: 1,
          limit: 100,
          total: 1
        }
      }

      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      const result = await fetcher.fetchUserWearables('0xabc123')

      expect(mockFetch.fetch).toHaveBeenCalledWith(
        'https://marketplace-api.com/v1/users/0xabc123/wearables/grouped?limit=100&offset=0',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        })
      )

      expect(result.wearables).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.wearables[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v2:0x123:1',
        amount: 2,
        individualData: [
          {
            id: 'id1',
            tokenId: '1',
            transferredAt: '1640995200000',
            price: '100.5'
          },
          {
            id: 'id2',
            tokenId: '2',
            transferredAt: '1640995300000',
            price: '200.75'
          }
        ],
        name: 'Cool Hat',
        rarity: 'epic',
        minTransferredAt: 1640995200000,
        maxTransferredAt: 1640995300000,
        category: WearableCategory.HAT
      })
    })

    it('should handle paginated responses', async () => {
      const page1Response = {
        ok: true,
        data: {
          elements: [
            {
              urn: 'urn:decentraland:ethereum:collections-v2:0x123:1',
              amount: 1,
              individualData: [{ id: 'id1', tokenId: '1', transferredAt: '1640995200000', price: '100' }],
              name: 'Item 1',
              rarity: 'common',
              minTransferredAt: 1640995200000,
              maxTransferredAt: 1640995200000,
              category: WearableCategory.HAT
            }
          ],
          page: 1,
          pages: 2,
          limit: 100,
          total: 2
        }
      }

      const page2Response = {
        ok: true,
        data: {
          elements: [
            {
              urn: 'urn:decentraland:ethereum:collections-v2:0x123:2',
              amount: 1,
              individualData: [{ id: 'id2', tokenId: '2', transferredAt: '1640995300000', price: '200' }],
              name: 'Item 2',
              rarity: 'rare',
              minTransferredAt: 1640995300000,
              maxTransferredAt: 1640995300000,
              category: WearableCategory.FEET
            }
          ],
          page: 2,
          pages: 2,
          limit: 100,
          total: 2
        }
      }

      mockFetch.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(page1Response)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(page2Response)
        })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      const result = await fetcher.fetchUserWearables('0xabc123')

      expect(mockFetch.fetch).toHaveBeenCalledTimes(2)
      expect(result.wearables).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.wearables[0].name).toBe('Item 1')
      expect(result.wearables[1].name).toBe('Item 2')
    })

    it('should throw MarketplaceApiError when API returns error status', async () => {
      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })

      await expect(fetcher.fetchUserWearables('0xabc123')).rejects.toThrow(MarketplaceApiError)
      await expect(fetcher.fetchUserWearables('0xabc123')).rejects.toThrow(
        'Marketplace API returned 500: Internal Server Error'
      )
    })

    it('should throw MarketplaceApiError when fetch fails', async () => {
      mockFetch.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })

      await expect(fetcher.fetchUserWearables('0xabc123')).rejects.toThrow(MarketplaceApiError)
      await expect(fetcher.fetchUserWearables('0xabc123')).rejects.toThrow(
        'Failed to fetch from marketplace API: Network error'
      )
    })
  })

  describe('fetchUserEmotes', () => {
    it('should fetch and transform emotes successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {
          elements: [
            {
              urn: 'urn:decentraland:ethereum:collections-v2:0x456:1',
              amount: 1,
              individualData: [
                {
                  id: 'emote-id1',
                  tokenId: '1',
                  transferredAt: '1640995200000',
                  price: '50.25'
                }
              ],
              name: 'Dance Move',
              rarity: 'legendary',
              minTransferredAt: 1640995200000,
              maxTransferredAt: 1640995200000,
              category: EmoteCategory.DANCE
            }
          ],
          page: 1,
          pages: 1,
          limit: 100,
          total: 1
        }
      }

      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      const result = await fetcher.fetchUserEmotes('0xdef456')

      expect(mockFetch.fetch).toHaveBeenCalledWith(
        'https://marketplace-api.com/v1/users/0xdef456/emotes/grouped?limit=100&offset=0',
        expect.any(Object)
      )

      expect(result.emotes).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.emotes[0]).toEqual({
        urn: 'urn:decentraland:ethereum:collections-v2:0x456:1',
        amount: 1,
        individualData: [
          {
            id: 'emote-id1',
            tokenId: '1',
            transferredAt: '1640995200000',
            price: '50.25'
          }
        ],
        name: 'Dance Move',
        rarity: 'legendary',
        minTransferredAt: 1640995200000,
        maxTransferredAt: 1640995200000,
        category: EmoteCategory.DANCE
      })
    })
  })

  describe('fetchUserNames', () => {
    it('should fetch and transform names successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {
          elements: [
            {
              name: 'myname.dcl.eth',
              contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
              tokenId: '12345',
              price: 100
            },
            {
              name: 'anothername.dcl.eth',
              contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
              tokenId: '67890'
              // price is optional
            }
          ],
          page: 1,
          pages: 1,
          limit: 100,
          total: 2
        }
      }

      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      const result = await fetcher.fetchUserNames('0x789abc')

      expect(mockFetch.fetch).toHaveBeenCalledWith(
        'https://marketplace-api.com/v1/users/0x789abc/names?limit=100&offset=0',
        expect.any(Object)
      )

      expect(result.names).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.names[0]).toEqual({
        name: 'myname.dcl.eth',
        contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
        tokenId: '12345',
        price: 100
      })
      expect(result.names[1]).toEqual({
        name: 'anothername.dcl.eth',
        contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
        tokenId: '67890',
        price: undefined
      })
    })
  })

  describe('URL configuration', () => {
    it('should remove trailing slash from base URL', async () => {
      mockConfig.getString.mockResolvedValue('https://marketplace-api.com/')

      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ok: true,
          data: { elements: [], page: 1, pages: 1, limit: 100, total: 0 }
        })
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      await fetcher.fetchUserWearables('0xtest')

      expect(mockFetch.fetch).toHaveBeenCalledWith(
        'https://marketplace-api.com/v1/users/0xtest/wearables/grouped?limit=100&offset=0',
        expect.any(Object)
      )
    })

    it('should lowercase addresses in API calls', async () => {
      mockFetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ok: true,
          data: { elements: [], page: 1, pages: 1, limit: 100, total: 0 }
        })
      })

      const fetcher = await createMarketplaceApiFetcher({ config: mockConfig, fetch: mockFetch, logs })
      await fetcher.fetchUserWearables('0xABC123DEF')

      expect(mockFetch.fetch).toHaveBeenCalledWith(
        'https://marketplace-api.com/v1/users/0xabc123def/wearables/grouped?limit=100&offset=0',
        expect.any(Object)
      )
    })
  })
})
