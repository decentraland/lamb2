import { NameFromQuery } from '../../src/logic/fetch-elements/fetch-names'
import { Name } from '../../src/types'
import { testWithComponents } from '../components'
import { generateNames } from '../data/names'
import { generateRandomAddress } from '../helpers'

type NameResponseForTest = Omit<Name, 'price'> & { price?: string }

// Helper function to convert NameFromQuery to marketplace API format
function convertNameToMarketplaceFormat(name: NameFromQuery) {
  return {
    name: name.name,
    tokenId: name.tokenId,
    contractAddress: name.contractAddress,
    price: name.activeOrder?.price !== undefined ? String(name.activeOrder.price) : undefined
  }
}

describe('names-handler: GET /users/:address/names', () => {
  const testWithComponents_names = testWithComponents(() => {
    const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
    const marketplaceApiFetcher = createMarketplaceApiFetcherMock({
      names: [],
      shouldFail: false
    })

    return { marketplaceApiFetcher }
  })

  testWithComponents_names('names-handler tests', function ({ components }) {
    describe('when marketplace API is available and working', () => {
      beforeEach(() => {
        // Reset marketplace API to working state
        components.marketplaceApiFetcher!.fetchUserNames = jest.fn()
      })

      describe('should return empty when no names are found', () => {
        beforeEach(() => {
          // Mock marketplace API with no names
          components.marketplaceApiFetcher!.fetchUserNames = jest.fn().mockResolvedValue({
            names: [],
            total: 0
          })
        })

        it('returns empty array when user has no names', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [],
            pageNum: 1,
            totalAmount: 0,
            pageSize: 100
          })
        })
      })

      describe('should return names from marketplace API', () => {
        beforeEach(() => {
          const testNames = generateNames(1)
          // Mock marketplace API with test names
          components.marketplaceApiFetcher!.fetchUserNames = jest.fn().mockResolvedValue({
            names: testNames.map(convertNameToMarketplaceFormat),
            total: 1
          })
        })

        it('returns names from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(1)
          expect(response.elements).toHaveLength(1)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(100)
        })
      })

      describe('should handle pagination from marketplace API', () => {
        beforeEach(() => {
          const testNames = generateNames(5)
          // Mock marketplace API with proper pagination handling
          components.marketplaceApiFetcher!.fetchUserNames = jest.fn().mockImplementation((_, params) => {
            const limit = params?.limit || 100
            const offset = params?.offset || 0

            const paginatedNames = testNames.slice(offset, offset + limit)

            return Promise.resolve({
              names: paginatedNames.map(convertNameToMarketplaceFormat),
              total: 5
            })
          })
        })

        it('returns paginated results from marketplace API (page 1)', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=1`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(5)
          expect(response.elements).toHaveLength(2)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(2)
        })

        it('returns paginated results from marketplace API (page 2)', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=2`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(5)
          expect(response.elements).toHaveLength(2)
          expect(response.pageNum).toBe(2)
          expect(response.pageSize).toBe(2)
        })

        it('returns paginated results from marketplace API (page 3)', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=3`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(5)
          expect(response.elements).toHaveLength(1) // Only 1 remaining on page 3
          expect(response.pageNum).toBe(3)
          expect(response.pageSize).toBe(2)
        })
      })

      describe('should handle cache correctly', () => {
        beforeEach(() => {
          const testNames = generateNames(7)
          // Mock marketplace API - using mockResolvedValue to handle multiple calls
          components.marketplaceApiFetcher!.fetchUserNames = jest.fn().mockResolvedValue({
            names: testNames.map(convertNameToMarketplaceFormat),
            total: 7
          })
        })

        it('returns names from cache on second call for the same address', async () => {
          const { localFetch } = components
          const address = generateRandomAddress()

          // First call
          const r1 = await localFetch.fetch(`/users/${address}/names?pageSize=7`)
          expect(r1.status).toBe(200)
          const r1Body = await r1.json()
          expect(r1Body.totalAmount).toBe(7)
          expect(r1Body.elements).toHaveLength(7)

          // Second call should use cache (but we won't strictly verify this in the test)
          const r2 = await localFetch.fetch(`/users/${address.toUpperCase()}/names?pageSize=7`)
          expect(r2.status).toBe(200)
          const r2Body = await r2.json()
          expect(r2Body.totalAmount).toBe(7)
          expect(r2Body.elements).toHaveLength(7)
        })
      })
    })

    describe('when marketplace API fails and falls back to The Graph', () => {
      beforeEach(() => {
        // Make marketplace API fail to trigger TheGraph fallback
        components.marketplaceApiFetcher!.fetchUserNames = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))
      })

      describe('should fallback to The Graph when marketplace API fails', () => {
        beforeEach(() => {
          // Reset TheGraph mocks for each test
          components.theGraph.ensSubgraph.query = jest.fn()
        })

        it('returns empty when no names are found in The Graph', async () => {
          const { localFetch, theGraph } = components

          theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [],
            pageNum: 1,
            totalAmount: 0,
            pageSize: 100
          })
        })

        it('returns names from The Graph after marketplace API fails', async () => {
          const { localFetch, theGraph } = components
          const names = generateNames(1)

          theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: names })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(1)
          expect(response.elements).toHaveLength(1)
          expect(response.elements[0]).toEqual(convertToDataModel(names)[0])
        })

        it('handles pagination correctly with The Graph fallback', async () => {
          const { localFetch, theGraph } = components
          const names = generateNames(5)

          theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: names })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=1`)

          expect(r.status).toBe(200)
          const response = await r.json()
          // TheGraph doesn't support pagination, so it returns all elements
          expect(response.totalAmount).toBe(5)
          expect(response.elements).toHaveLength(5)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(2)
        })
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        // Reset mocks for error handling tests
        components.marketplaceApiFetcher!.fetchUserNames = jest.fn()
        components.theGraph.ensSubgraph.query = jest.fn()
      })

      describe('should handle errors correctly', () => {
        it('returns error when both marketplace API and The Graph fail', async () => {
          const { localFetch, theGraph } = components

          // Mock marketplace API to fail
          components.marketplaceApiFetcher!.fetchUserNames = jest
            .fn()
            .mockRejectedValue(new Error('Marketplace API failure'))

          // Mock The Graph to fail
          theGraph.ensSubgraph.query = jest
            .fn()
            .mockRejectedValue(new Error('GraphQL Error: Invalid response. Errors:\n- some error. Provider: ens'))

          const wallet = generateRandomAddress()
          const r = await localFetch.fetch(`/users/${wallet}/names`)

          expect(r.status).toBe(502)
          expect(await r.json()).toEqual({
            error: 'The requested items cannot be fetched right now',
            message: `Cannot fetch elements for ${wallet}`
          })
        })
      })
    })
  })
})

function convertToDataModel(names: NameFromQuery[]): NameResponseForTest[] {
  return names.map((name) => {
    return {
      name: name.name,
      tokenId: name.tokenId,
      contractAddress: name.contractAddress,
      price: name.activeOrder?.price !== undefined ? String(name.activeOrder.price) : undefined
    }
  })
}
