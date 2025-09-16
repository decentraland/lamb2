import { nameZA } from '../../../src/logic/sorting'
import { testWithComponents } from '../../components'
import { generateThirdPartyWearables, generateWearableEntities, getThirdPartyProviders } from '../../data/wearables'
import { generateRandomAddress } from '../../helpers'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'
import { convertToThirdPartyWearableResponse } from './convert-to-model-third-party'

// mutable object
const linkedWearableCollectionProvider = {
  id: 'urn:decentraland:matic:collections-thirdparty:test-collection',
  resolver: 'https://decentraland-api.test.com/v1',
  metadata: {
    thirdParty: {
      name: 'test collection',
      description: 'test collection',
      contracts: [
        {
          network: 'mainnet',
          address: '0xcontract'
        }
      ]
    }
  }
}

// NOTE: each test generates a new wallet to avoid matches on cache
testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()

  const resolverResponse = {
    thirdParties: [linkedWearableCollectionProvider]
  }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})(
  'third-party-wearables-handler: GET /users/:address/third-party-wearables with a single provider should',
  function ({ components }) {
    beforeEach(() => {
      // Update collection ID before each test to ensure cache isolation
      linkedWearableCollectionProvider.id = `urn:decentraland:matic:collections-thirdparty:test-collection-${Math.random().toString(36).substring(7)}`
    })

    it('return empty when no wearables are found', async () => {
      const { localFetch, fetch, alchemyNftFetcher } = components

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
      fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ entities: [] }) })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        pageNum: 1,
        totalAmount: 0,
        pageSize: 100
      })
      expect(fetch.fetch).toHaveBeenCalledTimes(0)
    })

    it('return empty when no wearables are found with includeDefinitions set', async () => {
      const { localFetch, fetch, alchemyNftFetcher } = components

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
      fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ entities: [] }) })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables?includeDefinitions`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        pageNum: 1,
        totalAmount: 0,
        pageSize: 100
      })
      expect(fetch.fetch).toHaveBeenCalledTimes(0)
    })

    it('return wearables when found', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(2)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return wearables when found with entities when set', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(2)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables?includeDefinitions`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }, true),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return a single wearable with definition 2 times, returning from cache on second round', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(1)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)
      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      fetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const firstResponse = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables?includeDefinitions`
      )
      const secondResponse = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables?includeDefinitions`
      )
      const firstResponseAsJson = await firstResponse.json()

      expect(firstResponse.status).toBe(200)
      expect(firstResponseAsJson).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }, true),
        totalAmount: 1,
        pageNum: 1,
        pageSize: 100
      })
      expect(secondResponse.status).toBe(firstResponse.status)
      expect(await secondResponse.json()).toEqual(firstResponseAsJson)
    })

    it('return paginated wearables (total 7, page 1, size 3)', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(7)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables?pageSize=3`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables.slice(0, 3), { entities, contentServerUrl }),
        totalAmount: 7,
        pageNum: 1,
        pageSize: 3
      })
    })

    it('return paginated wearables (total 7, page 2, size 3)', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(7)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables?pageNum=2&pageSize=3`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables.slice(3, 6), { entities, contentServerUrl }),
        totalAmount: 7,
        pageNum: 2,
        pageSize: 3
      })
    })

    it('return paginated wearables (total 7, page 3, size 3)', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(7)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables?pageNum=3&pageSize=3`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse([wearables[6]], { entities, contentServerUrl }),
        totalAmount: 7,
        pageNum: 3,
        pageSize: 3
      })
    })

    it('return wearables sorted by name', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components
      const wearables = generateThirdPartyWearables(2)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)
      fetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => ({
          entities: entities
        })
      })

      const r = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables?sort=name&direction=ASC`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })

      const r2 = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables?sort=name&direction=DESC`
      )

      expect(r2.status).toBe(200)
      expect(await r2.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }).sort(nameZA),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })

      const r3 = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables?sort=name&direction=WHATEVER`
      )

      expect(r3.status).toBe(400)
      expect(await r3.json()).toEqual({
        error: 'Bad request',
        message: 'Invalid sorting requested: name WHATEVER'
      })
    })

    it('should hit cache on second request and avoid calling content-server collections endpoint', async () => {
      const { localFetch, fetch, content, contentServerUrl, alchemyNftFetcher } = components

      // Use a FIXED collection ID to ensure cache hit (don't generate new one in beforeEach)
      const fixedCollectionId = `urn:decentraland:matic:collections-thirdparty:cache-test-${Date.now()}`
      linkedWearableCollectionProvider.id = fixedCollectionId

      const wearables = generateThirdPartyWearables(3)
      const urns = wearables.map((wearable) => wearable.urn.decentraland)
      const entities = generateWearableEntities(urns)

      // Mock consistent responses for both requests
      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue(urns)

      // Mock collections endpoint (used on cache miss)
      fetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => ({
          total: entities.length,
          entities: entities
        })
      })

      // Mock individual entities endpoint (used on cache hit for full entity data)
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      // First request - should populate cache and call content-server collections endpoint
      const firstResponse = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables`)
      expect(firstResponse.status).toBe(200)

      // Verify first request made call to content-server collections endpoint
      expect(fetch.fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `${contentServerUrl}/entities/active/collections/${fixedCollectionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
          )
        )
      )
      const collectionsCallCount = (fetch.fetch as jest.Mock).mock.calls.length

      // Second request with SAME collection ID - should hit cache
      const secondResponse = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables`)
      expect(secondResponse.status).toBe(200)

      // Verify cache hit: fetch.fetch should NOT be called again for collections endpoint
      const finalCollectionsCallCount = (fetch.fetch as jest.Mock).mock.calls.length
      expect(finalCollectionsCallCount).toBe(collectionsCallCount) // No additional calls to collections endpoint

      // Verify that individual entities endpoint is called (cache hit behavior)
      // Note: may only fetch non-cached entities, not necessarily all URNs
      expect(content.fetchEntitiesByPointers).toHaveBeenCalled()

      // Both responses should be identical (proving cache works)
      const firstJson = await firstResponse.json()
      const secondJson = await secondResponse.json()
      expect(firstJson.totalAmount).toBe(secondJson.totalAmount)
      expect(firstJson.elements.length).toBe(secondJson.elements.length)
    })
  }
)
