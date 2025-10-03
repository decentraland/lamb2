import { Entity } from '@dcl/schemas'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { testWithComponents } from '../components'
import {
  generateBaseWearables,
  generateThirdPartyWearables,
  generateWearableEntities,
  generateWearables,
  getThirdPartyProviders
} from '../data/wearables'

import { MixedWearableResponse, MixedWearableTrimmedResponse } from '../../src/controllers/handlers/explorer-handler'
import { leastRareOptional, nameAZ, nameZA, rarestOptional } from '../../src/logic/sorting'
import { BaseWearable, ThirdPartyAsset } from '../../src/types'
import { createTheGraphComponentMock } from '../mocks/the-graph-mock'
import { generateRandomAddress } from '../helpers'

type ContentInfo = {
  entities: Entity[]
  contentServerUrl: string
}

testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const thirdPartyProvidersResponse = {
    thirdParties: [
      {
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
    ]
  }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(thirdPartyProvidersResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('wearables-handler: GET /explorer/:address/wearables', function ({ components }) {
  it('return descriptive errors for bad requests', async () => {
    const { localFetch } = components

    const wallet = generateRandomAddress()

    const r = await localFetch.fetch(`/explorer/${wallet}/wearables?collectionType=fourth-party`)
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({
      error: 'Bad request',
      message: 'Invalid collection type. Valid types are: base-wearable, on-chain, third-party.'
    })

    const r2 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=owner`)
    expect(r2.status).toBe(400)
    expect(await r2.json()).toEqual({
      error: 'Bad request',
      message: "Invalid sorting requested: 'owner DESC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
    })

    const r3 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=rarity&direction=INC`)
    expect(r3.status).toBe(400)
    expect(await r3.json()).toEqual({
      error: 'Bad request',
      message: "Invalid sorting requested: 'rarity INC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
    })

    const r4 = await localFetch.fetch(`/explorer/${wallet}/wearables?rarity=espectacular`)
    expect(r4.status).toBe(400)
    expect(await r4.json()).toEqual({
      error: 'Bad request',
      message: "Invalid rarity requested: 'espectacular'."
    })
  })

  it('return only base wearables when no on-chain or third-party found', async () => {
    const { baseWearablesFetcher, content, fetch, localFetch, alchemyNftFetcher, theGraph } = components

    const baseWearables = generateBaseWearables(278)
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer))
    )
    fetch.fetch = jest.fn().mockImplementation(() => {
      return { ok: true, json: () => ({ assets: [] }) }
    })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({
      pageNum: 1,
      totalAmount: 278,
      pageSize: 100
    })
  })

  it('return base + on-chain + third-party wearables', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(2)
    const onChainWearables = generateWearables(2)
    const thirdPartyWearables = generateThirdPartyWearables(2)
    const entities = generateWearableEntities([
      ...baseWearables.map((wearable) => wearable.urn),
      ...onChainWearables.map((wearable) => wearable.urn),
      ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    ])

    alchemyNftFetcher.getNFTsForOwner = jest
      .fn()
      .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer))
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        return {
          ok: true,
          json: () => ({
            entities: generateWearableEntities(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
          })
        }
      } else {
        return { ok: true, json: () => ({ entities: [] }) }
      }
    })

    const convertedMixedBaseWearables = convertToMixedBaseWearableResponse(baseWearables, {
      entities,
      contentServerUrl
    })
    const convertedMixedOnChainWearables = convertToMixedOnChainWearableResponse(onChainWearables, {
      entities,
      contentServerUrl
    })
    const convertedMixedThirdPartyWearables = convertToMixedThirdPartyWearableResponse(thirdPartyWearables, {
      entities,
      contentServerUrl
    })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response.elements).toHaveLength(6)

    // Verify ON_CHAIN wearables don't have minTransferredAt/maxTransferredAt in response
    const onChainElements = response.elements.filter(el => el.type === 'on-chain')
    for (const element of onChainElements) {
      expect(element).not.toHaveProperty('minTransferredAt')
      expect(element).not.toHaveProperty('maxTransferredAt')
    }

    const r3 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=rarity&direction=desc`)
    expect(r3.status).toBe(200)
    const response3 = await r3.json()
    expect(response3).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response3.elements).toHaveLength(6)

    const r4 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=rarity&direction=asc`)
    expect(r4.status).toBe(200)
    const response4 = await r4.json()
    expect(response4).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response4.elements).toHaveLength(6)

    const r5 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=name&direction=asc`)
    expect(r5.status).toBe(200)
    const response5 = await r5.json()
    expect(response5).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response5.elements).toHaveLength(6)

    const r6 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=name&direction=desc`)
    expect(r6.status).toBe(200)
    const response6 = await r6.json()
    expect(response6).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response6.elements).toHaveLength(6)

    const r7 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=date&direction=asc`)
    expect(r7.status).toBe(200)
    const response7 = await r7.json()
    expect(response7).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response7.elements).toHaveLength(6)

    const r8 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=date&direction=desc`)
    expect(r8.status).toBe(200)
    const response8 = await r8.json()
    expect(response8).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(response8.elements).toHaveLength(6)

    const r9 = await localFetch.fetch(`/explorer/${wallet}/wearables?name=1`)
    expect(r9.status).toBe(200)
    const response9 = await r9.json()
    expect(response9).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
    expect(response9.elements).toHaveLength(2)

    const r10 = await localFetch.fetch(`/explorer/${wallet}/wearables?category=eyewear`)
    expect(r10.status).toBe(200)
    const response10 = await r10.json()
    expect(response10).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
    expect(response10.elements).toHaveLength(2)

    const r11 = await localFetch.fetch(`/explorer/${wallet}/wearables?category=earring&category=body_shape`)
    expect(r11.status).toBe(200)
    const response11 = await r11.json()
    expect(response11).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: 4
    })
    expect(response11.elements).toHaveLength(4)

    const r12 = await localFetch.fetch(`/explorer/${wallet}/wearables?rarity=unique`)
    expect(r12.status).toBe(200)
    const response12 = await r12.json()
    expect(response12).toMatchObject({
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
    expect(response12.elements).toHaveLength(2)
  })

  it('return trimmed response when trimmed=true parameter is provided', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const onChainWearables = generateWearables(1)
    const thirdPartyWearables = generateThirdPartyWearables(1)
    const entities = generateWearableEntities([
      ...baseWearables.map((wearable) => wearable.urn),
      ...onChainWearables.map((wearable) => wearable.urn),
      ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    ])

    alchemyNftFetcher.getNFTsForOwner = jest
      .fn()
      .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        const thirdPartyEntities = entities.filter(entity =>
          thirdPartyWearables.some(w => w.urn.decentraland === entity.id)
        )
        return {
          ok: true,
          json: () => ({
            entities: thirdPartyEntities
          })
        }
      } else {
        return { ok: true, json: () => ({ entities: [] }) }
      }
    })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true`)

    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify response structure
    expect(response).toHaveProperty('elements')
    expect(response).toHaveProperty('pageNum', 1)
    expect(response).toHaveProperty('pageSize', 100)
    expect(response).toHaveProperty('totalAmount', 3)

    // Verify that all elements have the trimmed structure (type + entity only)
    expect(response.elements).toHaveLength(3)

    for (const element of response.elements) {
      // Verify it has the trimmed structure: only entity
      expect(element).toHaveProperty('entity')
      expect(Object.keys(element)).toEqual(['entity'])

      // Verify the entity is an ExplorerWearableEntity
      expect(element.entity).toHaveProperty('id')
      expect(element.entity).toHaveProperty('thumbnail')
      expect(element.entity).toHaveProperty('metadata')
      expect(element.entity.metadata).toHaveProperty('id')
      expect(element.entity.metadata).toHaveProperty('data')
      expect(element.entity.metadata.data).toHaveProperty('category')
      expect(element.entity.metadata.data).toHaveProperty('representations')

      // Verify it's NOT a full Entity (should not have these properties)
      expect(element.entity).not.toHaveProperty('version')
      expect(element.entity).not.toHaveProperty('type')
      expect(element.entity).not.toHaveProperty('pointers')
      expect(element.entity).not.toHaveProperty('timestamp')
      expect(element.entity).not.toHaveProperty('content')
    }
  })

  it('return non-trimmed response when trimmed=false or not provided', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const onChainWearables = generateWearables(1)
    const thirdPartyWearables = generateThirdPartyWearables(1)
    const entities = generateWearableEntities([
      ...baseWearables.map((wearable) => wearable.urn),
      ...onChainWearables.map((wearable) => wearable.urn),
      ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    ])

    alchemyNftFetcher.getNFTsForOwner = jest
      .fn()
      .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        const thirdPartyEntities = entities.filter(entity =>
          thirdPartyWearables.some(w => w.urn.decentraland === entity.id)
        )
        return {
          ok: true,
          json: () => ({
            entities: thirdPartyEntities
          })
        }
      } else {
        return { ok: true, json: () => ({ entities: [] }) }
      }
    })

    const wallet = generateRandomAddress()

    // Test with trimmed=false
    const r1 = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=false`)
    expect(r1.status).toBe(200)
    const response1 = await r1.json()

    // Test without trimmed parameter (should default to false)
    const r2 = await localFetch.fetch(`/explorer/${wallet}/wearables`)
    expect(r2.status).toBe(200)
    const response2 = await r2.json()

    // Both responses should be identical
    expect(response1).toEqual(response2)

    // Verify that all elements have the full entity structure
    for (const element of response1.elements) {
      expect(element).toHaveProperty('entity')

      // Verify it's a full Entity (should have these properties)
      expect(element.entity).toHaveProperty('id')
      expect(element.entity).toHaveProperty('version')
      expect(element.entity).toHaveProperty('type')
      expect(element.entity).toHaveProperty('pointers')
      expect(element.entity).toHaveProperty('timestamp')
      expect(element.entity).toHaveProperty('content')
      expect(element.entity).toHaveProperty('metadata')
    }
  })

  it('return full response when trimmed parameter has invalid value', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
    fetch.fetch = jest.fn().mockImplementation(() => {
      return { ok: true, json: () => ({ assets: [] }) }
    })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=invalid`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response.elements[0]).toHaveProperty('entity')
    expect(response.elements[0].entity).toHaveProperty('version')
    expect(response.elements[0].entity).toHaveProperty('metadata')
  })

  it('return trimmed response when trimmed=1 parameter is provided', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
    fetch.fetch = jest.fn().mockImplementation(() => {
      return { ok: true, json: () => ({ assets: [] }) }
    })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=1`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response.elements[0]).toHaveProperty('entity')
    expect(Object.keys(response.elements[0])).toEqual(['entity'])
    expect(response.elements[0].entity).toHaveProperty('metadata')
    expect(response.elements[0].entity).not.toHaveProperty('version')
  })

  it('sort trimmed responses correctly', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(3)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
    fetch.fetch = jest.fn().mockImplementation(() => {
      return { ok: true, json: () => ({ assets: [] }) }
    })

    const wallet = generateRandomAddress()

    // Test sorting by name (ASC) with trimmed responses
    const r1 = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&orderBy=name&direction=asc`)
    expect(r1.status).toBe(200)
    const response1 = await r1.json()
    expect(response1.elements).toHaveLength(3)
    // Verify all elements have the trimmed structure
    for (const element of response1.elements) {
      expect(element).toHaveProperty('entity')
      expect(Object.keys(element)).toEqual(['entity'])
      expect(element.entity).toHaveProperty('metadata')
    }

    // Test sorting by rarity (DESC) with trimmed responses
    const r2 = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&orderBy=rarity&direction=desc`)
    expect(r2.status).toBe(200)
    const response2 = await r2.json()
    expect(response2.elements).toHaveLength(3)
    // Verify all elements have the trimmed structure
    for (const element of response2.elements) {
      expect(element).toHaveProperty('entity')
      expect(Object.keys(element)).toEqual(['entity'])
      expect(element.entity).toHaveProperty('metadata')
    }

    // Test sorting by date (DESC) with trimmed responses
    const r3 = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&orderBy=date&direction=desc`)
    expect(r3.status).toBe(200)
    const response3 = await r3.json()
    expect(response3.elements).toHaveLength(3)
    // Verify all elements have the trimmed structure
    for (const element of response3.elements) {
      expect(element).toHaveProperty('entity')
      expect(Object.keys(element)).toEqual(['entity'])
      expect(element.entity).toHaveProperty('metadata')
    }
  })

  it('maintain backward compatibility with existing API', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, contentServerUrl, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(2)
    const onChainWearables = generateWearables(2)
    const thirdPartyWearables = generateThirdPartyWearables(2)
    const entities = generateWearableEntities([
      ...baseWearables.map((wearable) => wearable.urn),
      ...onChainWearables.map((wearable) => wearable.urn),
      ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    ])

    alchemyNftFetcher.getNFTsForOwner = jest
      .fn()
      .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer))
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        return {
          ok: true,
          json: () => ({
            entities: generateWearableEntities(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))
          })
        }
      } else {
        return { ok: true, json: () => ({ entities: [] }) }
      }
    })

    const wallet = generateRandomAddress()

    // Test default behavior (no trimmed parameter) - should return full entities
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)
    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify response structure matches expected format
    expect(response).toHaveProperty('elements')
    expect(response).toHaveProperty('pageNum')
    expect(response).toHaveProperty('pageSize')
    expect(response).toHaveProperty('totalAmount')

    // Verify all elements have the expected structure (full wearable objects)
    for (const element of response.elements) {
      expect(element).toHaveProperty('type')
      expect(element).toHaveProperty('urn')
      expect(element).toHaveProperty('amount')
      expect(element).toHaveProperty('individualData')
      expect(element).toHaveProperty('category')
      expect(element).toHaveProperty('name')
      expect(element).toHaveProperty('entity')

      // Verify entity is a full Entity object
      expect(element.entity).toHaveProperty('id')
      expect(element.entity).toHaveProperty('version')
      expect(element.entity).toHaveProperty('type')
      expect(element.entity).toHaveProperty('pointers')
      expect(element.entity).toHaveProperty('timestamp')
      expect(element.entity).toHaveProperty('content')
      expect(element.entity).toHaveProperty('metadata')
    }

    // Verify ON_CHAIN wearables have minTransferredAt/maxTransferredAt removed in response
    const onChainElements = response.elements.filter(el => el.type === 'on-chain')
    for (const element of onChainElements) {
      expect(element).not.toHaveProperty('minTransferredAt')
      expect(element).not.toHaveProperty('maxTransferredAt')
    }
  })
})

function convertToMixedBaseWearableResponse(
  wearables: BaseWearable[],
  contentInfo: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const entity = contentInfo.entities.find((def) => def.id === wearable.urn)
    return {
      type: 'base-wearable',
      urn: wearable.urn,
      amount: 1,
      individualData: [
        {
          id: wearable.urn
        }
      ],
      category: wearable.category,
      name: wearable.name,
      entity: entity
    }
  })
}

function convertToMixedOnChainWearableResponse(
  wearables: WearableFromQuery[],
  { entities }: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const individualData = {
      id: `${wearable.urn}:${wearable.tokenId}`,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    const rarity = wearable.item.rarity
    const entity = entities.find((def) => def.id === wearable.urn)

    return {
      type: 'on-chain',
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      entity: entity
    }
  })
}

function convertToMixedThirdPartyWearableResponse(wearables: any[], { entities }: ContentInfo): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const entity = entities.find((def) => def.id === wearable.urn.decentraland)
    return {
      type: 'third-party',
      urn: wearable.urn.decentraland,
      amount: wearable.amount,
      individualData: [
        {
          id: wearable.id
        }
      ],
      category: entity.metadata.data.category,
      name: entity.metadata.name,
      entity: entity
    }
  })
}
