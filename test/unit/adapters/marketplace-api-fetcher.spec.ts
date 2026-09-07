import { createLogComponent } from '@well-known-components/logger'
import { IFetchComponent } from '@dcl/core-commons'
import {
  createMarketplaceApiFetcher,
  MarketplaceApiError,
  MarketplaceApiSaturatedError
} from '../../../src/adapters/marketplace-api-fetcher'
import { ServiceOverloadedError } from '../../../src/types'
import { WearableCategory, EmoteCategory } from '@dcl/schemas'

describe('MarketplaceApiFetcher', () => {
  let mockConfig: any
  let mockFetch: IFetchComponent
  let logs: any

  beforeEach(async () => {
    logs = await createLogComponent({})

    mockConfig = {
      getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
      getNumber: jest.fn().mockResolvedValue(undefined)
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
        'https://marketplace-api.com/v1/users/0xabc123/wearables/grouped?limit=1000&offset=0',
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
        'https://marketplace-api.com/v1/users/0xdef456/emotes/grouped?limit=1000&offset=0',
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
        'https://marketplace-api.com/v1/users/0x789abc/names?limit=1000&offset=0',
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
        'https://marketplace-api.com/v1/users/0xtest/wearables/grouped?limit=1000&offset=0',
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
        'https://marketplace-api.com/v1/users/0xabc123def/wearables/grouped?limit=1000&offset=0',
        expect.any(Object)
      )
    })
  })
})

describe('when the owned items span several pages', () => {
  const PAGES = 10
  let fetch: { fetch: jest.Mock }
  let inFlight: number
  let maxInFlight: number
  let names: string[]

  beforeEach(async () => {
    inFlight = 0
    maxInFlight = 0
    // Later pages answer sooner than earlier ones, so page order in the result is not
    // completion order.
    fetch = {
      fetch: jest.fn(async (url: string) => {
        const page = Number(new URL(url).searchParams.get('offset')) / 1000 + 1
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise((resolve) => setTimeout(resolve, (PAGES + 1 - page) * 3))
        inFlight--
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              elements: [
                {
                  urn: `urn:${page}`,
                  amount: 1,
                  individualData: [{ id: `id-${page}`, tokenId: '1', transferredAt: '1', price: '1' }],
                  name: `Item ${page}`,
                  rarity: 'common',
                  minTransferredAt: 1,
                  maxTransferredAt: 1,
                  category: WearableCategory.HAT
                }
              ],
              page,
              pages: PAGES,
              limit: 1000,
              total: PAGES
            }
          })
        }
      })
    }
    const logs = await createLogComponent({})
    const fetcher = await createMarketplaceApiFetcher({
      config: {
        getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
        getNumber: jest.fn().mockResolvedValue(undefined)
      } as any,
      fetch: fetch as any,
      logs
    })
    names = (await fetcher.fetchUserWearables('0xabc')).wearables.map((wearable) => wearable.name)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should request every page once', () => {
    expect(fetch.fetch).toHaveBeenCalledTimes(PAGES)
  })

  it('should stitch the elements back in page order even though later pages finished first', () => {
    expect(names).toEqual(Array.from({ length: PAGES }, (_, index) => `Item ${index + 1}`))
  })

  it('should fetch the remaining pages concurrently, never more than four at a time', () => {
    expect(maxInFlight).toBe(4)
  })
})

describe('when the upstream declares an implausible page count', () => {
  let fetch: { fetch: jest.Mock }
  let fetcher: Awaited<ReturnType<typeof createMarketplaceApiFetcher>>

  beforeEach(async () => {
    fetch = { fetch: jest.fn() }
    fetcher = await createMarketplaceApiFetcher({
      config: {
        getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
        getNumber: jest.fn().mockResolvedValue(undefined)
      } as any,
      fetch: fetch as any,
      logs: await createLogComponent({})
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  function pageWith(pages: unknown) {
    return {
      ok: true,
      json: async () => ({ ok: true, data: { elements: [], page: 1, pages, limit: 1000, total: 0 } })
    }
  }

  describe('and the count is absurdly large', () => {
    beforeEach(() => {
      fetch.fetch.mockImplementation(async () => pageWith(1_000_000_000))
    })

    it('should fail explicitly rather than return part of the inventory as all of it', async () => {
      await expect(fetcher.fetchUserWearables('0xabc')).rejects.toThrow(MarketplaceApiError)
    })

    it('should not request any further page', async () => {
      await fetcher.fetchUserWearables('0xabc').catch(() => undefined)
      expect(fetch.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the count is not an integer', () => {
    beforeEach(() => {
      fetch.fetch.mockImplementation(async () => pageWith('lots'))
    })

    it('should fail explicitly', async () => {
      await expect(fetcher.fetchUserWearables('0xabc')).rejects.toThrow(MarketplaceApiError)
    })
  })

  describe('and the inventory is empty, declared as zero pages', () => {
    let result: Awaited<ReturnType<typeof fetcher.fetchUserWearables>>

    beforeEach(async () => {
      fetch.fetch.mockImplementation(async () => pageWith(0))
      result = await fetcher.fetchUserWearables('0xabc')
    })

    it('should answer empty from the single request', () => {
      expect(result.wearables).toEqual([])
    })
  })
})

describe('when more marketplace requests are in flight than the bulkhead allows', () => {
  let outcomes: PromiseSettledResult<unknown>[]

  beforeEach(async () => {
    const limits: Record<string, number> = {
      MARKETPLACE_API_MAX_CONCURRENT_FETCHES: 1,
      MARKETPLACE_API_MAX_QUEUED_FETCHES: 0
    }
    const fetch = {
      fetch: jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return {
          ok: true,
          json: async () => ({ ok: true, data: { elements: [], page: 1, pages: 1, limit: 1000, total: 0 } })
        }
      })
    }
    const fetcher = await createMarketplaceApiFetcher({
      config: {
        getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
        getNumber: jest.fn(async (key: string) => limits[key])
      } as any,
      fetch: fetch as any,
      logs: await createLogComponent({})
    })
    outcomes = await Promise.allSettled([fetcher.fetchUserWearables('0x1'), fetcher.fetchUserWearables('0x2')])
  })

  it('should serve the request that found a slot', () => {
    expect(outcomes[0].status).toBe('fulfilled')
  })

  it('should fail the excess request fast with a saturation error, not a marketplace error', () => {
    expect(outcomes[1].status === 'rejected' && outcomes[1].reason instanceof MarketplaceApiSaturatedError).toBe(true)
  })
})

describe('when the bulkhead settings are invalid', () => {
  let logs: any

  beforeEach(async () => {
    logs = await createLogComponent({})
  })

  function fetcherWith(settings: Record<string, number>) {
    return createMarketplaceApiFetcher({
      config: {
        getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
        getNumber: jest.fn(async (key: string) => settings[key])
      } as any,
      fetch: { fetch: jest.fn() } as any,
      logs
    })
  }

  it('should refuse a concurrency of zero, which would leave every fetch queued forever', async () => {
    await expect(fetcherWith({ MARKETPLACE_API_MAX_CONCURRENT_FETCHES: 0 })).rejects.toThrow(
      'MARKETPLACE_API_MAX_CONCURRENT_FETCHES'
    )
  })

  it('should refuse a fractional concurrency', async () => {
    await expect(fetcherWith({ MARKETPLACE_API_MAX_CONCURRENT_FETCHES: 1.5 })).rejects.toThrow(
      'MARKETPLACE_API_MAX_CONCURRENT_FETCHES'
    )
  })

  it('should refuse a non-numeric queue size, which would make the queue unbounded', async () => {
    await expect(fetcherWith({ MARKETPLACE_API_MAX_QUEUED_FETCHES: NaN })).rejects.toThrow(
      'MARKETPLACE_API_MAX_QUEUED_FETCHES'
    )
  })

  it('should refuse a negative queue size', async () => {
    await expect(fetcherWith({ MARKETPLACE_API_MAX_QUEUED_FETCHES: -1 })).rejects.toThrow(
      'MARKETPLACE_API_MAX_QUEUED_FETCHES'
    )
  })
})

describe('when a multi-page inventory is fetched under the tightest bulkhead settings', () => {
  let fetch: { fetch: jest.Mock }
  let names: string[]

  beforeEach(async () => {
    fetch = {
      fetch: jest.fn(async (url: string) => {
        const page = Number(new URL(url).searchParams.get('offset')) / 1000 + 1
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              elements: [
                {
                  urn: `urn:${page}`,
                  amount: 1,
                  individualData: [{ id: `id-${page}`, tokenId: '1', transferredAt: '1', price: '1' }],
                  name: `Item ${page}`,
                  rarity: 'common',
                  minTransferredAt: 1,
                  maxTransferredAt: 1,
                  category: WearableCategory.HAT
                }
              ],
              page,
              pages: 3,
              limit: 1000,
              total: 3
            }
          })
        }
      })
    }
    const settings: Record<string, number> = {
      MARKETPLACE_API_MAX_CONCURRENT_FETCHES: 1,
      MARKETPLACE_API_MAX_QUEUED_FETCHES: 0
    }
    const fetcher = await createMarketplaceApiFetcher({
      config: {
        getString: jest.fn().mockResolvedValue('https://marketplace-api.com'),
        getNumber: jest.fn(async (key: string) => settings[key])
      } as any,
      fetch: fetch as any,
      logs: await createLogComponent({})
    })
    names = (await fetcher.fetchUserWearables('0xabc')).wearables.map((wearable) => wearable.name)
  })

  it('should fetch every page, since the bulkhead bounds fetches and a fetch cannot starve its own pages', () => {
    expect(names).toEqual(['Item 1', 'Item 2', 'Item 3'])
  })
})

describe('when a fetch is shed', () => {
  it('should surface as a service overload, so it reaches the client as a retryable failure', () => {
    expect(new MarketplaceApiSaturatedError('full')).toBeInstanceOf(ServiceOverloadedError)
  })
})
