import Wallet from 'ethereumjs-wallet'
import { testWithComponents } from '../../components'
import { generateThirdPartyWearables, generateWearableContentDefinitions } from '../../data/wearables'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'
import { convertToThirdPartyWearableResponse } from './convert-to-model-third-party'
import { nameZA } from '../../../src/logic/sorting'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = {
    thirdParties: [
      {
        id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
        resolver: 'https://decentraland-api.babydoge.com/v1'
      }
    ]
  }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})(
  'third-party-wearables-handler: GET /users/:address/third-party-wearables with a single provider should',
  function ({ components }) {
    it('return empty when no wearables are found', async () => {
      const { localFetch, fetch } = components

      fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })

      const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        pageNum: 1,
        totalAmount: 0,
        pageSize: 100
      })
      expect(fetch.fetch).toHaveBeenCalledTimes(1)
    })

    it('return empty when no wearables are found with includeDefinitions set', async () => {
      const { localFetch, fetch } = components

      fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        pageNum: 1,
        totalAmount: 0,
        pageSize: 100
      })
      expect(fetch.fetch).toHaveBeenCalledTimes(1)
    })

    it('return wearables when found', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(2)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return wearables when found with definitions when set', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(2)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }, true),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return two wearables but only one including definitions', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(2)
      wearables[0].urn.decentraland = 'non-cached-urn'
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }, true),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return a single wearable with definition 2 times, returning from cache on second round', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(1)
      wearables[0].urn.decentraland = 'to-be-cached-urn'
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
      fetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const firstResponse = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`
      )
      const secondResponse = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`
      )
      const firstResponseAsJson = await firstResponse.json()

      expect(firstResponse.status).toBe(200)
      expect(firstResponseAsJson).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }, true),
        totalAmount: 1,
        pageNum: 1,
        pageSize: 100
      })
      expect(secondResponse.status).toBe(firstResponse.status)
      expect(await secondResponse.json()).toEqual(firstResponseAsJson)
      expect(content.fetchEntitiesByPointers).toBeCalledTimes(1)
    })

    it('return paginated wearables (total 7, page 1, size 3)', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(7)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageSize=3`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables.slice(0, 3), { definitions, content }),
        totalAmount: 7,
        pageNum: 1,
        pageSize: 3
      })
    })

    it('return paginated wearables (total 7, page 2, size 3)', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(7)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageNum=2&pageSize=3`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables.slice(3, 6), { definitions, content }),
        totalAmount: 7,
        pageNum: 2,
        pageSize: 3
      })
    })

    it('return paginated wearables (total 7, page 3, size 3)', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(7)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

      fetch.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageNum=3&pageSize=3`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse([wearables[6]], { definitions, content }),
        totalAmount: 7,
        pageNum: 3,
        pageSize: 3
      })
    })

    it('return empty when third party provider fails', async () => {
      const { localFetch, fetch } = components

      fetch.fetch = jest.fn().mockResolvedValueOnce({ ok: false })

      const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        totalAmount: 0,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return wearables sorted by name', async () => {
      const { localFetch, fetch, content } = components
      const wearables = generateThirdPartyWearables(2)
      const definitions = generateWearableContentDefinitions(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
      content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
      fetch.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => ({
          assets: wearables
        })
      })

      const r = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?sort=name&direction=ASC`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })

      const r2 = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?sort=name&direction=DESC`
      )

      expect(r2.status).toBe(200)
      expect(await r2.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { definitions, content }).sort(nameZA),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })

      const r3 = await localFetch.fetch(
        `/users/${Wallet.generate().getAddressString()}/third-party-wearables?sort=name&direction=WHATEVER`
      )

      expect(r3.status).toBe(400)
      expect(await r3.json()).toEqual({
        error: 'Bad request',
        message: 'Invalid sorting requested: name WHATEVER'
      })
    })
  }
)
