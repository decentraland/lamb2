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

  let mockProfileWearable: OnChainWearable
  let mockProfileEmote: OnChainEmote
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
      getOwnedNamesOnly: jest.fn(),
      getAllWearablesByOwner: jest.fn(),
      getAllEmotesByOwner: jest.fn(),
      getAllNamesByOwner: jest.fn()
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

    // Setup test data - now using OnChain types directly since marketplace-api returns grouped data
    mockProfileWearable = {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      name: 'Ethermon Feet',
      category: WearableCategory.FEET,
      rarity: Rarity.COMMON,
      amount: 1,
      individualData: [
        {
          id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
          tokenId: '123',
          transferredAt: 1234567890000,
          price: 100
        }
      ],
      minTransferredAt: 1234567890000,
      maxTransferredAt: 1234567890000
    }

    mockProfileEmote = {
      urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
      name: 'Dance Emote',
      category: EmoteCategory.DANCE,
      rarity: Rarity.RARE,
      amount: 1,
      individualData: [
        {
          id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
          tokenId: '456',
          transferredAt: 1234567890000,
          price: 200
        }
      ],
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
        mockMarketplaceApiFetcher.getAllWearablesByOwner.mockResolvedValue([mockProfileWearable])
      })

      it('should return wearables from marketplace API', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getAllWearablesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
        expect(result[0].name).toBe('Ethermon Feet')
        expect(result[0].category).toBe(WearableCategory.FEET)
      })

      it('should log successful marketplace API fetch', async () => {
        await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched all wearables from marketplace-api', {
          owner: '0x123',
          count: 1
        })
      })

      it('should construct individualData correctly from marketplace-api data', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1)
        expect(result[0].individualData).toHaveLength(1)
        expect(result[0].individualData[0]).toEqual({
          id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
          tokenId: '123',
          transferredAt: 1234567890000,
          price: 100
        })
        expect(result[0].amount).toBe(1)
        expect(result[0].minTransferredAt).toBe(1234567890000)
        expect(result[0].maxTransferredAt).toBe(1234567890000)
      })

      it('should group multiple wearables with same URN from marketplace-api', async () => {
        // Since marketplace-api now returns grouped data, we mock it as already grouped
        const mockGroupedWearable: OnChainWearable = {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          name: 'Ethermon Feet',
          category: WearableCategory.FEET,
          rarity: Rarity.COMMON,
          amount: 2,
          individualData: [
            {
              id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
              tokenId: '123',
              transferredAt: 1234567890000,
              price: 100
            },
            {
              id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:456',
              tokenId: '456',
              transferredAt: 1234567895000,
              price: 150
            }
          ],
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567895000
        }

        mockMarketplaceApiFetcher.getAllWearablesByOwner.mockResolvedValue([mockGroupedWearable])

        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1) // Grouped by URN
        expect(result[0].amount).toBe(2)
        expect(result[0].individualData).toHaveLength(2)
        expect(result[0].individualData).toEqual([
          {
            id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123',
            tokenId: '123',
            transferredAt: 1234567890000,
            price: 100
          },
          {
            id: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:456',
            tokenId: '456',
            transferredAt: 1234567895000,
            price: 150
          }
        ])
        expect(result[0].minTransferredAt).toBe(1234567890000)
        expect(result[0].maxTransferredAt).toBe(1234567895000)
      })
    })

    describe('and marketplace API fails', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getAllWearablesByOwner.mockRejectedValue(new Error('API Error'))
        mockTheGraph.ethereumCollectionsSubgraph.query.mockResolvedValue(mockGraphWearableResponse)
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue({ nfts: [] })
      })

      it('should fallback to TheGraph', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getAllWearablesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
        expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
      })

      it('should log the fallback warning and success', async () => {
        await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch all wearables from marketplace-api, falling back to TheGraph',
          {
            owner: '0x123',
            error: 'API Error'
          }
        )

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched all wearables from TheGraph fallback', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and both marketplace API and TheGraph fail', () => {
      const apiError = new Error('API Error')
      const graphError = new Error('Graph Error')

      beforeEach(() => {
        mockMarketplaceApiFetcher.getAllWearablesByOwner.mockRejectedValue(apiError)
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
          'Failed to fetch all wearables from both marketplace-api and TheGraph',
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
        mockMarketplaceApiFetcher.getAllWearablesByOwner.mockRejectedValue('String error')
        mockTheGraph.ethereumCollectionsSubgraph.query.mockResolvedValue(mockGraphWearableResponse)
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue({ nfts: [] })
      })

      it('should handle non-Error objects in fallback', async () => {
        const result = await fetchAllWearablesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1)
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch all wearables from marketplace-api, falling back to TheGraph',
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
        mockMarketplaceApiFetcher.getAllEmotesByOwner.mockResolvedValue([mockProfileEmote])
      })

      it('should return emotes from marketplace API', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getAllEmotesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance')
        expect(result[0].name).toBe('Dance Emote')
        expect(result[0].category).toBe(EmoteCategory.DANCE)
      })

      it('should log successful marketplace API fetch', async () => {
        await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched all emotes from marketplace-api', {
          owner: '0x123',
          count: 1
        })
      })

      it('should construct individualData correctly from marketplace-api data', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1)
        expect(result[0].individualData).toHaveLength(1)
        expect(result[0].individualData[0]).toEqual({
          id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
          tokenId: '456',
          transferredAt: 1234567890000,
          price: 200
        })
        expect(result[0].amount).toBe(1)
        expect(result[0].minTransferredAt).toBe(1234567890000)
        expect(result[0].maxTransferredAt).toBe(1234567890000)
      })

      it('should group multiple emotes with same URN from marketplace-api', async () => {
        // Since marketplace-api now returns grouped data, we mock it as already grouped
        const mockGroupedEmote: OnChainEmote = {
          urn: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance',
          name: 'Dance Emote',
          category: EmoteCategory.DANCE,
          rarity: Rarity.RARE,
          amount: 2,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
              tokenId: '456',
              transferredAt: 1234567890000,
              price: 200
            },
            {
              id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:789',
              tokenId: '789',
              transferredAt: 1234567895000,
              price: 250
            }
          ],
          minTransferredAt: 1234567890000,
          maxTransferredAt: 1234567895000
        }

        mockMarketplaceApiFetcher.getAllEmotesByOwner.mockResolvedValue([mockGroupedEmote])

        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(1) // Grouped by URN
        expect(result[0].amount).toBe(2)
        expect(result[0].individualData).toHaveLength(2)
        expect(result[0].individualData).toEqual([
          {
            id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:456',
            tokenId: '456',
            transferredAt: 1234567890000,
            price: 200
          },
          {
            id: 'urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance:789',
            tokenId: '789',
            transferredAt: 1234567895000,
            price: 250
          }
        ])
        expect(result[0].minTransferredAt).toBe(1234567890000)
        expect(result[0].maxTransferredAt).toBe(1234567895000)
      })
    })

    describe('and marketplace API returns empty results', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getAllEmotesByOwner.mockResolvedValue([])
      })

      it('should handle empty results correctly', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(result).toHaveLength(0)
        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched all emotes from marketplace-api', {
          owner: '0x123',
          count: 0
        })
      })
    })

    describe('and marketplace API fails', () => {
      beforeEach(() => {
        mockMarketplaceApiFetcher.getAllEmotesByOwner.mockRejectedValue(new Error('API Error'))
        mockTheGraph.maticCollectionsSubgraph.query.mockResolvedValue(mockGraphEmoteResponse)
      })

      it('should fallback to TheGraph', async () => {
        const result = await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockMarketplaceApiFetcher.getAllEmotesByOwner).toHaveBeenCalledWith('0x123')
        expect(mockTheGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
        expect(result).toHaveLength(1)
        expect(result[0].urn).toBe('urn:decentraland:matic:collections-v1:dgtble_headspace:dgtble_dance')
      })

      it('should log the fallback warning and success', async () => {
        await fetchAllEmotesWithFallback(mockComponents, '0x123')

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to fetch all emotes from marketplace-api, falling back to TheGraph',
          {
            owner: '0x123',
            error: 'API Error'
          }
        )

        expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched all emotes from TheGraph fallback', {
          owner: '0x123',
          count: 1
        })
      })
    })

    describe('and both marketplace API and TheGraph fail', () => {
      const apiError = new Error('API Error')
      const graphError = new Error('Graph Error')

      beforeEach(() => {
        mockMarketplaceApiFetcher.getAllEmotesByOwner.mockRejectedValue(apiError)
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

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch all emotes from both marketplace-api and TheGraph',
          {
            owner: '0x123',
            marketplaceError: 'API Error',
            graphError: 'Graph Error'
          }
        )
      })
    })
  })
})
