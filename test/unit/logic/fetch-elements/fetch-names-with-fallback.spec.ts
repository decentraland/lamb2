import { ILoggerComponent } from '@well-known-components/interfaces'
import { fetchAllNamesWithFallback } from '../../../../src/logic/fetch-elements/fetch-names-with-fallback'
import { Name } from '../../../../src/types'
import { ProfileName } from '../../../../src/adapters/marketplace-types'
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

describe('fetch-names-with-fallback', () => {
  let mockLogger: MockLogger
  let mockMarketplaceApiFetcher: jest.Mocked<IMarketplaceApiFetcher>
  let mockTheGraph: MockTheGraphComponent
  let mockComponents: TestComponents

  let mockProfileName: ProfileName
  let mockGraphNameResponse: { nfts: any[] }

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

    // Setup test data
    mockProfileName = {
      name: 'testname.dcl.eth',
      contractAddress: '0x123abc',
      tokenId: '123',
      price: 500
    }

    mockGraphNameResponse = {
      nfts: [
        {
          name: 'testname.dcl.eth',
          contractAddress: '0x123abc',
          tokenId: '123',
          activeOrder: {
            price: '500000000000000000000'
          }
        }
      ]
    }

    jest.clearAllMocks()
  })

  describe('when marketplace API is successful', () => {
    beforeEach(() => {
      mockMarketplaceApiFetcher.getAllNamesByOwner.mockResolvedValue([mockProfileName])
    })

    it('should return names from marketplace API', async () => {
      const result = await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(mockMarketplaceApiFetcher.getAllNamesByOwner).toHaveBeenCalledWith('0x123')
      expect(mockTheGraph.ensSubgraph.query).not.toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('testname.dcl.eth')
      expect(result[0].contractAddress).toBe('0x123abc')
      expect(result[0].tokenId).toBe('123')
      expect(result[0].price).toBe(500)
    })

    it('should log successful marketplace API fetch', async () => {
      await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched names from marketplace-api', {
        owner: '0x123',
        count: 1
      })
    })
  })

  describe('when marketplace API returns empty results', () => {
    beforeEach(() => {
      mockMarketplaceApiFetcher.getAllNamesByOwner.mockResolvedValue([])
    })

    it('should handle empty results correctly', async () => {
      const result = await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(result).toHaveLength(0)
      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched names from marketplace-api', {
        owner: '0x123',
        count: 0
      })
    })
  })

  describe('when marketplace API fails', () => {
    beforeEach(() => {
      mockMarketplaceApiFetcher.getAllNamesByOwner.mockRejectedValue(new Error('API Error'))
      mockTheGraph.ensSubgraph.query.mockResolvedValue(mockGraphNameResponse)
    })

    it('should fallback to TheGraph', async () => {
      const result = await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(mockMarketplaceApiFetcher.getAllNamesByOwner).toHaveBeenCalledWith('0x123')
      expect(mockTheGraph.ensSubgraph.query).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('testname.dcl.eth')
    })

    it('should log the fallback warning and success', async () => {
      await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch names from marketplace-api, falling back to TheGraph',
        {
          owner: '0x123',
          error: 'API Error'
        }
      )
      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully fetched names from TheGraph fallback', {
        owner: '0x123',
        count: 1
      })
    })
  })

  describe('when both marketplace API and TheGraph fail', () => {
    const apiError = new Error('API Error')
    const graphError = new Error('Graph Error')

    beforeEach(() => {
      mockMarketplaceApiFetcher.getAllNamesByOwner.mockRejectedValue(apiError)
      mockTheGraph.ensSubgraph.query.mockRejectedValue(graphError)
    })

    it('should throw the graph error', async () => {
      await expect(fetchAllNamesWithFallback(mockComponents, '0x123')).rejects.toThrow('Graph Error')
    })

    it('should log both errors', async () => {
      try {
        await fetchAllNamesWithFallback(mockComponents, '0x123')
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch names from both marketplace-api and TheGraph', {
        owner: '0x123',
        marketplaceError: 'API Error',
        graphError: 'Graph Error'
      })
    })
  })

  describe('when marketplace API throws non-Error object', () => {
    beforeEach(() => {
      mockMarketplaceApiFetcher.getAllNamesByOwner.mockRejectedValue('String error')
      mockTheGraph.ensSubgraph.query.mockResolvedValue(mockGraphNameResponse)
    })

    it('should handle non-Error objects in fallback', async () => {
      const result = await fetchAllNamesWithFallback(mockComponents, '0x123')

      expect(result).toHaveLength(1)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch names from marketplace-api, falling back to TheGraph',
        {
          owner: '0x123',
          error: 'Unknown error'
        }
      )
    })
  })
})
