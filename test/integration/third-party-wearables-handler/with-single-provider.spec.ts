import { testWithComponents } from '../../components'
import { generateWearableContentDefinitions, generateThirdPartyWearables, getThirdPartyProviders } from '../../data/wearables'
import Wallet from 'ethereumjs-wallet'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'
import { Entity } from '@dcl/schemas'
import { ContentComponent } from '../../../src/ports/content'
import { ThirdPartyAsset } from '../../../src/types'
import { extractWearableDefinitionFromEntity } from '../../../src/adapters/definitions'
import { ThirdPartyWearableResponse } from '../../../src/controllers/handlers/third-party-wearables-handler'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = {
    thirdParties: [{
      id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
      resolver: 'https://decentraland-api.babydoge.com/v1'
    }]
  }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('third-party-wearables-handler: GET /users/:address/third-party-wearables with a single provider should', function ({ components }) {
  it('return empty when no wearables are found', async () => {
    const { localFetch, fetch } = components

    fetch.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })

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

    fetch.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`)

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
    const { localFetch, fetch } = components
    const wearables = generateThirdPartyWearables(2)

    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables),
      totalAmount: 2,
      pageNum: 1,
      pageSize: 100
    })
  })

  it('return wearables when found with definitions when set', async () => {
    const { localFetch, fetch, content } = components
    const wearables = generateThirdPartyWearables(2)
    const definitions = generateWearableContentDefinitions(wearables.map(wearable => wearable.urn.decentraland))

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables, { definitions, content }),
      totalAmount: 2,
      pageNum: 1,
      pageSize: 100
    })
  })

  it('return two wearables but only one including definitions', async () => {
    const { localFetch, fetch, content } = components
    const wearables = generateThirdPartyWearables(2)
    wearables[0].urn.decentraland = 'non-cached-urn'
    const definitions = generateWearableContentDefinitions([wearables[1].urn.decentraland])

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables, { definitions, content }),
      totalAmount: 2,
      pageNum: 1,
      pageSize: 100
    })
  })

  it('return a single wearable with definition 2 times, returning from cache on second round', async () => {
    const { localFetch, fetch, content } = components
    const wearables = generateThirdPartyWearables(1)
    wearables[0].urn.decentraland = 'to-be-cached-urn'
    const definitions = generateWearableContentDefinitions([wearables[0].urn.decentraland])

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    fetch.fetch = jest.fn()
      .mockResolvedValue({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const firstResponse = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`)
    const secondResponse = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?includeDefinitions`)
    const firstResponseAsJson = await firstResponse.json()

    expect(firstResponse.status).toBe(200)
    expect(firstResponseAsJson).toEqual({
      elements: convertToDataModel(wearables, { definitions, content }),
      totalAmount: 1,
      pageNum: 1,
      pageSize: 100
    })
    expect(secondResponse.status).toBe(firstResponse.status)
    expect(await secondResponse.json()).toEqual(firstResponseAsJson)
    expect(content.fetchEntitiesByPointers).toBeCalledTimes(1)
  })

  it('return paginated wearables (total 7, page 1, size 3)', async () => {
    const { localFetch, fetch } = components
    const wearables = generateThirdPartyWearables(7)

    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageSize=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables.slice(0, 3)),
      totalAmount: 7,
      pageNum: 1,
      pageSize: 3
    })
  })

  it('return paginated wearables (total 7, page 2, size 3)', async () => {
    const { localFetch, fetch } = components
    const wearables = generateThirdPartyWearables(7)

    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageNum=2&pageSize=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables.slice(3, 6)),
      totalAmount: 7,
      pageNum: 2,
      pageSize: 3
    })
  })

  it('return paginated wearables (total 7, page 3, size 3)', async () => {
    const { localFetch, fetch } = components
    const wearables = generateThirdPartyWearables(7)

    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true, json: () => ({
          assets: wearables
        })
      })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables?pageNum=3&pageSize=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([wearables[6]]),
      totalAmount: 7,
      pageNum: 3,
      pageSize: 3
    })
  })

  it('return empty when third party provider fails', async () => {
    const { localFetch, fetch } = components

    fetch.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      totalAmount: 0,
      pageNum: 1,
      pageSize: 100
    })
  })
})

type ContentInfo = {
  definitions: Entity[],
  content: ContentComponent
}

function convertToDataModel(
  wearables: ThirdPartyAsset[],
  contentInfo?: ContentInfo
): ThirdPartyWearableResponse[] {
  return wearables.map((wearable): ThirdPartyWearableResponse => {
    const definition = contentInfo?.definitions.find((def) => def.id === wearable.urn.decentraland)
    const content = contentInfo?.content
    return {
      amount: wearable.amount,
      individualData: [{
        id: wearable.id
      }],
      urn: wearable.urn.decentraland,
      definition: definition ? extractWearableDefinitionFromEntity({ content }, definition) : undefined
    }
  })
}