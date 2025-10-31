import { createLogComponent } from '@well-known-components/logger'
import { fetchWearables, fetchEmotes } from '../../../src/logic/fetch-elements/fetch-items'
import { fetchNames } from '../../../src/logic/fetch-elements/fetch-names'
import { MarketplaceApiFetcher, MarketplaceApiError } from '../../../src/adapters/marketplace-api-fetcher'
import { WearableCategory, EmoteCategory } from '@dcl/schemas'
import { TheGraphComponent } from '../../../src/ports/the-graph'

describe('Fetch Functions with Marketplace API Fallback', () => {
  let mockLogs: any
  let mockTheGraph: TheGraphComponent
  let mockMarketplaceApiFetcher: MarketplaceApiFetcher

  beforeEach(async () => {
    mockLogs = await createLogComponent({})

    mockTheGraph = {
      ethereumCollectionsSubgraph: {
        query: jest.fn()
      },
      maticCollectionsSubgraph: {
        query: jest.fn()
      },
      ensSubgraph: {
        query: jest.fn()
      }
    } as any

    mockMarketplaceApiFetcher = {
      fetchUserWearables: jest.fn(),
      fetchUserEmotes: jest.fn(),
      fetchUserNames: jest.fn()
    }
  })

  describe('fetchWearables', () => {
    it('should use marketplace API when available and successful', async () => {
      const mockWearables = [
        {
          urn: 'urn:decentraland:ethereum:collections-v2:0x123:1',
          amount: 1,
          individualData: [{ id: 'id1', tokenId: '1', transferredAt: 1640995200000, price: 100 }],
          name: 'Cool Hat',
          rarity: 'epic',
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000,
          category: WearableCategory.HAT
        }
      ]

      // Mock marketplace API to return correct format
      mockMarketplaceApiFetcher.fetchUserWearables = jest.fn().mockResolvedValue({
        wearables: mockWearables,
        total: 1
      })

      const result = await fetchWearables(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserWearables).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(result).toEqual({ elements: mockWearables, totalAmount: 1 })
    })

    it('should fallback to The Graph when marketplace API fails', async () => {
      const mockGraphWearables = [
        {
          id: 'graph-id',
          tokenId: '123',
          urn: 'urn:decentraland:ethereum:collections-v2:0x456:1',
          transferredAt: 1640995200000,
          metadata: {
            wearable: {
              name: 'Graph Hat',
              category: WearableCategory.HAT
            }
          },
          item: { rarity: 'rare', price: 200 }
        }
      ]

      mockMarketplaceApiFetcher.fetchUserWearables = jest.fn().mockRejectedValue(new MarketplaceApiError('API Error'))

      mockTheGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      mockTheGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: mockGraphWearables })

      const result = await fetchWearables(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserWearables).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
      expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0].name).toBe('Graph Hat')
    })

    it('should use The Graph directly when no marketplace API fetcher provided', async () => {
      const mockGraphWearables = [
        {
          id: 'graph-id',
          tokenId: '123',
          urn: 'urn:decentraland:ethereum:collections-v2:0x456:1',
          transferredAt: 1640995200000,
          metadata: {
            wearable: {
              name: 'Graph Hat',
              category: WearableCategory.HAT
            }
          },
          item: { rarity: 'rare', price: 200 }
        }
      ]

      mockTheGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: mockGraphWearables })
      mockTheGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

      const result = await fetchWearables({ theGraph: mockTheGraph, logs: mockLogs }, '0xtest')

      expect(mockTheGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
      expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0].name).toBe('Graph Hat')
    })
  })

  describe('fetchEmotes', () => {
    it('should use marketplace API when available and successful', async () => {
      const mockEmotes = [
        {
          urn: 'urn:decentraland:ethereum:collections-v2:0x456:1',
          amount: 1,
          individualData: [{ id: 'emote-id1', tokenId: '1', transferredAt: 1640995200000, price: 50 }],
          name: 'Dance Move',
          rarity: 'legendary',
          minTransferredAt: 1640995200000,
          maxTransferredAt: 1640995200000,
          category: EmoteCategory.DANCE
        }
      ]

      // Mock marketplace API to return correct format
      mockMarketplaceApiFetcher.fetchUserEmotes = jest.fn().mockResolvedValue({
        emotes: mockEmotes,
        total: 1
      })

      const result = await fetchEmotes(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserEmotes).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(result).toEqual({ elements: mockEmotes, totalAmount: 1 })
    })

    it('should fallback to The Graph when marketplace API fails', async () => {
      const mockGraphEmotes = [
        {
          id: 'graph-emote-id',
          tokenId: '123',
          urn: 'urn:decentraland:ethereum:collections-v2:0x789:1',
          transferredAt: 1640995200000,
          metadata: {
            emote: {
              name: 'Graph Dance',
              category: EmoteCategory.DANCE
            }
          },
          item: { rarity: 'epic', price: 150 }
        }
      ]

      mockMarketplaceApiFetcher.fetchUserEmotes = jest.fn().mockRejectedValue(new Error('Network error'))

      mockTheGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: mockGraphEmotes })

      const result = await fetchEmotes(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserEmotes).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0].name).toBe('Graph Dance')
    })
  })

  describe('fetchNames', () => {
    it('should use marketplace API when available and successful', async () => {
      const mockNames = [
        {
          name: 'myname.dcl.eth',
          contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
          tokenId: '12345',
          price: 100
        }
      ]

      // Mock marketplace API to return correct format
      mockMarketplaceApiFetcher.fetchUserNames = jest.fn().mockResolvedValue({
        names: mockNames,
        total: 1
      })

      const result = await fetchNames(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserNames).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.ensSubgraph.query).not.toHaveBeenCalled()
      expect(result).toEqual({ elements: mockNames, totalAmount: 1 })
    })

    it('should fallback to The Graph when marketplace API fails', async () => {
      const mockGraphNames = [
        {
          id: 'graph-name-id',
          name: 'graphname.dcl.eth',
          contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
          tokenId: '67890',
          activeOrder: { price: 200 }
        }
      ]

      mockMarketplaceApiFetcher.fetchUserNames = jest
        .fn()
        .mockRejectedValue(new MarketplaceApiError('Service unavailable'))

      mockTheGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: mockGraphNames })

      const result = await fetchNames(
        { theGraph: mockTheGraph, logs: mockLogs, marketplaceApiFetcher: mockMarketplaceApiFetcher },
        '0xtest'
      )

      expect(mockMarketplaceApiFetcher.fetchUserNames).toHaveBeenCalledWith('0xtest', undefined)
      expect(mockTheGraph.ensSubgraph.query).toHaveBeenCalled()
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0].name).toBe('graphname.dcl.eth')
      expect(result.elements[0].price).toBe(200)
    })

    it('should use The Graph directly when no marketplace API fetcher provided', async () => {
      const mockGraphNames = [
        {
          id: 'graph-name-id',
          name: 'directname.dcl.eth',
          contractAddress: '0x2a187453064356c898df4fe204b0fa9f9eb45d33',
          tokenId: '11111'
          // no activeOrder
        }
      ]

      mockTheGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: mockGraphNames })

      const result = await fetchNames({ theGraph: mockTheGraph, logs: mockLogs }, '0xtest')

      expect(mockTheGraph.ensSubgraph.query).toHaveBeenCalled()
      expect(result.elements).toHaveLength(1)
      expect(result.elements[0].name).toBe('directname.dcl.eth')
      expect(result.elements[0].price).toBeUndefined()
    })
  })
})
