import { EmoteCategory, WearableCategory, Rarity } from '@dcl/schemas'
import { ILoggerComponent } from '@well-known-components/interfaces'
import {
  fetchAllWearablesWithFallback,
  fetchAllEmotesWithFallback
} from '../../../../src/logic/fetch-elements/fetch-items-with-fallback'
import { OnChainWearable, OnChainEmote } from '../../../../src/types'
import { ProfileWearable, ProfileEmote } from '../../../../src/adapters/marketplace-types'
import { IMarketplaceApiFetcher } from '../../../../src/adapters/marketplace-api-fetcher'
import { TheGraphComponent } from '../../../../src/ports/the-graph'

interface MockLogger {
  debug: jest.Mock
  warn: jest.Mock
  error: jest.Mock
  info: jest.Mock
  log: jest.Mock
  getLogger: jest.Mock
}

interface MockLoggerComponent extends ILoggerComponent {
  getLogger: jest.Mock<MockLogger>
}

interface MockSubgraph {
  query: jest.Mock
}

interface MockTheGraphComponent extends TheGraphComponent {
  ethereumCollectionsSubgraph: MockSubgraph
  maticCollectionsSubgraph: MockSubgraph
  ensSubgraph: MockSubgraph
  thirdPartyRegistrySubgraph: MockSubgraph
  landSubgraph: MockSubgraph
}

interface TestComponents {
  logs: MockLoggerComponent
  marketplaceApiFetcher: IMarketplaceApiFetcher
  theGraph: MockTheGraphComponent
}

describe('fetch-items-with-fallback', () => {
  let mockLogger: MockLogger
  let mockMarketplaceApiFetcher: jest.Mocked<IMarketplaceApiFetcher>
  let mockTheGraph: MockTheGraphComponent
  let mockComponents: TestComponents

  let mockProfileWearable: ProfileWearable
  let mockProfileEmote: ProfileEmote
  let mockGraphWearableResponse: { nfts: any[] }
  let mockGraphEmoteResponse: { nfts: any[] }

  beforeEach(() => {
    // Setup logger mock
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      getLogger: jest.fn(() => mockLogger)
    }

    // Setup marketplace API fetcher mock
    mockMarketplaceApiFetcher = {
      getWearablesByOwner: jest.fn(),
      getEmotesByOwner: jest.fn(),
      getNamesByOwner: jest.fn(),
      getOwnedWearablesUrnAndTokenId: jest.fn(),
      getOwnedEmotesUrnAndTokenId: jest.fn(),
      getOwnedNamesOnly: jest.fn()
    }

    // Setup TheGraph mock
    mockTheGraph = {
      ethereumCollectionsSubgraph: {
        query: jest.fn()
      },
      maticCollectionsSubgraph: {
        query: jest.fn()
      },
      ensSubgraph: {
        query: jest.fn()
      },
      thirdPartyRegistrySubgraph: {
        query: jest.fn()
      },
      landSubgraph: {
        query: jest.fn()
      }
    }

    // Setup components mock
    mockComponents = {
      logs: {
        getLogger: jest.fn(() => mockLogger)
      } as MockLoggerComponent,
      marketplaceApiFetcher: mockMarketplaceApiFetcher,
      theGraph: mockTheGraph
    }

    // Setup test data
    mockProfileWearable = {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      id: 'test-id',
      tokenId: '123',
      category: WearableCategory.FEET,
      transferredAt: 1234567890000,
      name: 'Ethermon Feet',
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

    mockProfileEmote = {
      urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
      id: 'test-emote-id',
      tokenId: '456',
      category: EmoteCategory.DANCE,
      transferredAt: 1234567890000,
      name: 'Dance Emote',
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

    mockGraphWearableResponse = {
      nfts: [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'graph-id',
          tokenId: '123',
          transferredAt: 1234567890,
          metadata: {
            wearable: {
              name: 'Ethermon Feet',
              category: WearableCategory.FEET
            }
          },
          item: {
            rarity: Rarity.COMMON,
            price: 100
          }
        }
      ]
    }

    mockGraphEmoteResponse = {
      nfts: [
        {
          urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
          id: 'graph-emote-id',
          tokenId: '456',
          transferredAt: 1234567890,
          metadata: {
            emote: {
              name: 'Dance Emote',
              category: EmoteCategory.DANCE
            }
          },
          item: {
            rarity: Rarity.RARE,
            price: 200
          }
        }
      ]
    }

    jest.clearAllMocks()
  })

  describe('when fetching wearables with fallback', () => {
    describe('and marketplace API is successful', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getWearablesByOwner.mockResolvedValue({
          data: [mockProfileWearable],
          total: 1
        })
      })

      it('should return wearables from marketplace API', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getWearablesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
        expect(result[0].name).toBe('Ethermon Feet')
        expect(result[0].category).toBe(WearableCategory.FEET)
      })

      it('should log successful marketplace API fetch', async () => {
        await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched wearables from marketplace-api', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and marketplace API fails', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getWearablesByOwner.mockRejectedValue(new Error('API Error'))
        mockTheGraph.ethereumCollectionsSubgraph.query.mockResolvedValue(mockGraphWearableResponse)
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue({ nfts: [] })
      })

      it('should fallback to TheGraph', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getWearablesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
        expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
      })

      it('should log the fallback warning and success', async () => {
        await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch wearables from marketplace-api, falling back to TheGraph',
          {
            owner: '0x123',
            error: 'API Error'
          }
        )
        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched wearables from TheGraph fallback', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and both marketplace API and TheGraph fail', () => {
      const apiError = new Error('API Error')
      const graphError = new Error('Graph Error')

      beforeEach(() => {
        mockMarketplaceApiFetcher.getWearablesByOwner.mockRejectedValue(apiError)
        mockTheGraph.ethereumCollectionsSubgraph.query.mockRejectedValue(graphError)
      })

      it('should throw the graph error', async () => {
        await expect(fetchAllWearablesWithFallback(mockComponents, '0x123')).rejects.toThrow('Graph Error')
      })

      it('should log both errors', async () => {
        try {
          await fetchAllWearablesWithFallback(mockComponents, '0x123')
        } catch (error) {
          // Expected to throw
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch wearables from both marketplace-api and TheGraph',
          {
            owner: '0x123',
            marketplaceError: 'API Error',
            graphError: 'Graph Error'
          }
        )
      })
    })

    describe('and marketplace API throws non-Error object', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getWearablesByOwner.mockRejectedValue('String error')
        mockTheGraph.ethereumCollectionsSubgraph.query.mockResolvedValue(mockGraphWearableResponse)
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue({ nfts: [] })
      })

      it('should handle non-Error objects in fallback', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1)
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch wearables from marketplace-api, falling back to TheGraph',
          {
            owner: '0x123',
            error: 'Unknown error'
          }
        )
      })
    })
  })

  describe('when fetching emotes with fallback', () => {
    describe('and marketplace API is successful', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getEmotesByOwner.mockResolvedValue({
          data: [mockProfileEmote],
          total: 1
        })
      })

      it('should return emotes from marketplace API', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getEmotesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance')
        expect(result[0].name).toBe('Dance Emote')
        expect(result[0].category).toBe(EmoteCategory.DANCE)
      })

      it('should log successful marketplace API fetch', async () => {
        await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched emotes from marketplace-api', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and marketplace API returns empty results', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getEmotesByOwner.mockResolvedValue({
          data: [],
          total: 0
        })
      })

      it('should handle empty results correctly', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(0)
        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched emotes from marketplace-api', {
          owner: '0x123',
          count: 0
        })
      })
    })

    describe('and marketplace API fails', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getEmotesByOwner.mockRejectedValue(new Error('API Error'))
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue(mockGraphEmoteResponse)
      })

      it('should fallback to TheGraph', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getEmotesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance')
      })

      it('should log the fallback warning and success', async () => {
        await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch emotes from marketplace-api, falling back to TheGraph',
          {
            owner: '0x123',
            error: 'API Error'
          }
        )
        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched emotes from TheGraph fallback', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and both marketplace API and TheGraph fail', () => {
      const apiError = new Error('API Error')
      const graphError = new Error('Graph Error')

      beforeEach(() => {
        mockMarketplaceApiFetcher.getEmotesByOwner.mockRejectedValue(apiError)
        mockTheGraph.maticCollectionsSubgraph.query.mockRejectedValue(graphError)
      })

      it('should throw the graph error', async () => {
        await expect(fetchAllEmotesWithFallback(mockComponents, '0x123')).rejects.toThrow('Graph Error')
      })

      it('should log both errors', async () => {
        try {
          await fetchAllEmotesWithFallback(mockComponents, '0x123')
        } catch (error) {
          // Expected to throw
        }

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch emotes from both marketplace-api and TheGraph', {
          owner: '0x123',
          marketplaceError: 'API Error',
          graphError: 'Graph Error'
        })
      })
    })
  })
})
