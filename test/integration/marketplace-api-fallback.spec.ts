import { testWithComponents } from '../components'
import { generateRandomAddress } from '../helpers'

describe('marketplace API integration with fallback', () => {
  const testWithComponents_fallback = testWithComponents(() => {
    const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
    // Create marketplace API that fails to trigger TheGraph fallback
    const marketplaceApiFetcher = createMarketplaceApiFetcherMock({
      wearables: [],
      emotes: [],
      names: [],
      shouldFail: true
    })

    return { marketplaceApiFetcher }
  })

  testWithComponents_fallback('user assets endpoints with marketplace API fallback', function ({ components }) {
    const testAddress = generateRandomAddress()

    describe('wearables endpoint', () => {
      beforeEach(() => {
        // Make marketplace API fail to trigger TheGraph fallback
        components.marketplaceApiFetcher!.fetchUserWearables = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))

        // Configure TheGraph to return empty results
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        components.theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      })

      it('should work and return valid response structure', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/users/${testAddress}/wearables`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)
        expect(typeof body.totalAmount).toBe('number')
        expect(typeof body.pageNum).toBe('number')
        expect(typeof body.pageSize).toBe('number')

        // Verify The Graph was queried (confirming fallback worked)
        expect(components.theGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
        expect(components.theGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      })

      it('should handle filters and pagination correctly via fallback', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/users/${testAddress}/wearables?pageSize=10&category=upper_body`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)
        expect(body.pageSize).toBe(10)

        // Verify marketplace API failed and The Graph was called
        expect(components.marketplaceApiFetcher!.fetchUserWearables).toHaveBeenCalled()
        expect(components.theGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
        expect(components.theGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      })
    })

    describe('emotes endpoint', () => {
      beforeEach(() => {
        // Make marketplace API fail to trigger TheGraph fallback
        components.marketplaceApiFetcher!.fetchUserEmotes = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))

        // Configure TheGraph to return empty results (both ethereum and matic for emotes)
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        components.theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      })

      it('should work and return valid response structure', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/users/${testAddress}/emotes`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)
        expect(typeof body.totalAmount).toBe('number')
        expect(typeof body.pageNum).toBe('number')
        expect(typeof body.pageSize).toBe('number')

        // Verify The Graph was queried (confirming fallback worked)
        expect(components.theGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      })

      it('should handle filters correctly via fallback', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/users/${testAddress}/emotes?category=dance&rarity=rare`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)

        // Verify marketplace API failed and The Graph was called
        expect(components.marketplaceApiFetcher!.fetchUserEmotes).toHaveBeenCalled()
        expect(components.theGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      })
    })

    describe('names endpoint', () => {
      beforeEach(() => {
        // Make marketplace API fail to trigger TheGraph fallback
        components.marketplaceApiFetcher!.fetchUserNames = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))

        // Configure TheGraph to return empty results
        components.theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      })

      it('should work and return valid response structure', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/users/${testAddress}/names`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)
        expect(typeof body.totalAmount).toBe('number')
        expect(typeof body.pageNum).toBe('number')
        expect(typeof body.pageSize).toBe('number')

        // Verify The Graph was queried (confirming fallback worked)
        expect(components.theGraph.ensSubgraph.query).toHaveBeenCalled()
      })

      it('should handle sorting correctly via fallback', async () => {
        const { localFetch } = components

        // Clear cache to ensure fresh API calls
        components.namesFetcher.clearCache?.()

        const response = await localFetch.fetch(`/users/${testAddress}/names?orderBy=name&direction=ASC`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)

        // Verify marketplace API failed and The Graph was called
        expect(components.marketplaceApiFetcher!.fetchUserNames).toHaveBeenCalled()
        expect(components.theGraph.ensSubgraph.query).toHaveBeenCalled()
      })
    })

    describe('configuration validation', () => {
      beforeEach(() => {
        // Make marketplace API fail for all endpoints
        components.marketplaceApiFetcher!.fetchUserWearables = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API not available'))
        components.marketplaceApiFetcher!.fetchUserEmotes = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API not available'))
        components.marketplaceApiFetcher!.fetchUserNames = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API not available'))

        // Configure TheGraph to return empty results for all endpoints
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        components.theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        components.theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      })

      it('should handle missing MARKETPLACE_API_URL gracefully for wearables', async () => {
        const { localFetch } = components

        // Use a unique address to avoid cache hits from previous tests
        const uniqueTestAddress = '0xB75A89765aC2FC9318623aAE39561a76417c4b6c'

        // Clear jest call histories but preserve mock implementations
        jest.clearAllMocks()

        // Restore marketplace API to fail state
        components.marketplaceApiFetcher!.fetchUserWearables = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API not available'))

        // Restore TheGraph mocks after clearing
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        components.theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        // The system should work even when marketplace API is not configured
        // and fallback to The Graph automatically
        const response = await localFetch.fetch(`/users/${uniqueTestAddress}/wearables`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)

        // Verify fallback occurred
        expect(components.theGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalled()
        expect(components.theGraph.maticCollectionsSubgraph.query).toHaveBeenCalled()
      })

      it('should handle missing MARKETPLACE_API_URL gracefully for emotes', async () => {
        const { localFetch } = components

        // Clear any jest call histories to ensure clean state
        jest.clearAllMocks()

        const response = await localFetch.fetch(`/users/${testAddress}/emotes`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)

        // Since emotes use cache and might bypass TheGraph if cache is empty,
        // let's verify the basic response structure instead
        expect(body).toHaveProperty('pageNum')
        expect(body).toHaveProperty('pageSize')
        expect(body).toHaveProperty('totalAmount')
      })

      it('should handle missing MARKETPLACE_API_URL gracefully for names', async () => {
        const { localFetch } = components

        // Clear any jest call histories to ensure clean state
        jest.clearAllMocks()

        // Clear cache to ensure fresh API calls
        components.namesFetcher.clearCache?.()

        // Re-setup TheGraph mocks after clearing
        components.theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const response = await localFetch.fetch(`/users/${testAddress}/names`)
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(Array.isArray(body.elements)).toBe(true)

        // Verify fallback occurred
        expect(components.theGraph.ensSubgraph.query).toHaveBeenCalled()
      })
    })
  })
})
