import { ThirdPartyAsset } from '../../../src/types'
import { testWithComponents } from '../../components'
import { generateThirdPartyWearables, generateWearableEntities, getThirdPartyProviders } from '../../data/wearables'
import { generateRandomAddress } from '../../helpers'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'
import { convertToThirdPartyWearableResponse } from './convert-to-model-third-party'

testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = { thirdParties: getThirdPartyProviders() }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})(
  'third-party-wearables-handler: GET /users/:address/third-party-wearables with multiple providers should',
  function ({ components }) {
    it('return wearables when found on a single provider', async () => {
      const { localFetch, fetch, content, contentServerUrl } = components
      const wearables = generateThirdPartyWearables(2)
      const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      fetch.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('babydoge')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables
            })
          }
        } else {
          return { ok: true, json: () => ({ assets: [] }) }
        }
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

    it('return wearables when found on multiple providers', async () => {
      const { localFetch, fetch, content, contentServerUrl } = components
      const wearables = generateThirdPartyWearables(6)
      const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      fetch.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('babydoge')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(0, 2)
            })
          }
        }

        if (url.includes('cryptoavatars')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(2, 4)
            })
          }
        }

        if (url.includes('unxd')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(4, 6)
            })
          }
        }
      })

      const r = await localFetch.fetch(`/users/${generateRandomAddress()}/third-party-wearables`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables, { entities, contentServerUrl }),
        totalAmount: 6,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('when setting third party name, it returns only the assets of that third party', async () => {
      const { localFetch, fetch, content, contentServerUrl } = components
      const wearables: ThirdPartyAsset[] = [
        {
          id: 'id0',
          amount: 1,
          urn: { decentraland: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin:collectionId:item0' }
        },
        {
          id: 'id1',
          amount: 1,
          urn: { decentraland: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin:collectionId:item1' }
        },
        {
          id: 'id2',
          amount: 1,
          urn: { decentraland: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:collectionId:item0' }
        },
        {
          id: 'id3',
          amount: 1,
          urn: { decentraland: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:collectionId:item1' }
        },
        {
          id: 'id4',
          amount: 1,
          urn: {
            decentraland: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip:collectionId:item0'
          }
        },
        {
          id: 'id5',
          amount: 1,
          urn: {
            decentraland: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip:collectionId:item1'
          }
        }
      ]
      const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn.decentraland))
      content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      fetch.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('babydoge')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(0, 2)
            })
          }
        }

        if (url.includes('cryptoavatars')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(2, 4)
            })
          }
        }

        if (url.includes('unxd')) {
          return {
            ok: true,
            json: () => ({
              assets: wearables.slice(4, 6)
            })
          }
        }
      })

      const r = await localFetch.fetch(
        `/users/${generateRandomAddress()}/third-party-wearables/urn:decentraland:matic:collections-thirdparty:cryptoavatars`
      )

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToThirdPartyWearableResponse(wearables.slice(2, 4), { entities, contentServerUrl }, false),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })
  }
)
