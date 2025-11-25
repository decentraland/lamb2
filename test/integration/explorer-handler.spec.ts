import { Entity, Network } from '@dcl/schemas'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { testWithComponents } from '../components'
import {
  generateBaseWearables,
  generateThirdPartyWearables,
  generateWearableEntities,
  generateWearables
} from '../data/wearables'

import { MixedWearableResponse } from '../../src/controllers/handlers/explorer-handler'
import { rarestOptional } from '../../src/logic/sorting'
import { BaseWearable } from '../../src/types'
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
  beforeEach(() => {
    const { entitiesFetcher } = components
    entitiesFetcher.clearCache()
  })

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
    const { baseWearablesFetcher, wearablesFetcher, content, fetch, localFetch, alchemyNftFetcher, theGraph } =
      components

    const baseWearables = generateBaseWearables(278)
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: [],
      totalAmount: 0
    })
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
    const {
      content,
      fetch,
      localFetch,
      theGraph,
      baseWearablesFetcher,
      wearablesFetcher,
      contentServerUrl,
      alchemyNftFetcher
    } = components
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
    // Fix: Return proper API format
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    // Fix: Mock wearablesFetcher to return the on-chain wearables
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: convertWearablesToOnChain(onChainWearables),
      totalAmount: onChainWearables.length
    })
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
    const actualResult = await r.json()
    const expectedElements = [
      ...convertedMixedBaseWearables,
      ...convertedMixedOnChainWearables,
      ...convertedMixedThirdPartyWearables
    ].sort(rarestOptional)

    expect(actualResult).toEqual({
      elements: expectedElements,
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
    expect(actualResult.elements).toHaveLength(6)

    // Verify ON_CHAIN wearables don't have minTransferredAt/maxTransferredAt in response
    const onChainElements = actualResult.elements.filter((el) => el.type === 'on-chain')
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
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
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: onChainWearables,
      totalAmount: onChainWearables.length
    })
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        const thirdPartyEntities = entities.filter((entity) =>
          thirdPartyWearables.some((w) => w.urn.decentraland === entity.id)
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
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
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: convertWearablesToOnChain(onChainWearables),
      totalAmount: onChainWearables.length
    })
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => entities.find((def) => def.id === pointer)).filter((e): e is Entity => e !== undefined)
    )
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-collection')) {
        const thirdPartyEntities = entities.filter((entity) =>
          thirdPartyWearables.some((w) => w.urn.decentraland === entity.id)
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: [],
      totalAmount: 0
    })
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(1)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: [],
      totalAmount: 0
    })
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
      components
    const baseWearables = generateBaseWearables(3)
    const entities = generateWearableEntities(baseWearables.map((wearable) => wearable.urn))

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: [],
      totalAmount: 0
    })
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
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher, wearablesFetcher, alchemyNftFetcher } =
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
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: baseWearables,
      totalAmount: baseWearables.length
    })
    wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
      elements: convertWearablesToOnChain(onChainWearables),
      totalAmount: onChainWearables.length
    })
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
    const onChainElements = response.elements.filter((el) => el.type === 'on-chain')
    for (const element of onChainElements) {
      expect(element).not.toHaveProperty('minTransferredAt')
      expect(element).not.toHaveProperty('maxTransferredAt')
    }
  })

  describe('when isSmartWearable parameter is provided', () => {
    let baseWearables: any[]
    let onChainWearables: any[]
    let thirdPartyWearables: any[]
    let entities: any[]
    let wallet: string

    beforeEach(() => {
      baseWearables = generateBaseWearables(2)
      onChainWearables = generateWearables(2)
      thirdPartyWearables = generateThirdPartyWearables(2)
      entities = generateWearableEntities([
        ...baseWearables.map((wearable) => wearable.urn),
        ...onChainWearables.map((wearable) => wearable.urn),
        ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
      ])
      wallet = generateRandomAddress()
    })

    describe('and isSmartWearable is true', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        // Mock baseWearablesFetcher to not be called when isSmartWearable=true
        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with smartWearable itemType
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        // Mock thirdPartyWearablesFetcher to not be called when isSmartWearable=true
        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should return only on-chain smart wearables', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables (smart wearables)
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with smartWearable itemType
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'smartWearable'
        })
      })

      it('should return only on-chain smart wearables when isSmartWearable=1', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=1`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables (smart wearables)
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with smartWearable itemType
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'smartWearable'
        })
      })

      it('should exclude base wearables when isSmartWearable=true', async () => {
        const { localFetch, baseWearablesFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=true`)

        // baseWearablesFetcher should not be called when isSmartWearable=true
        expect(baseWearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      })

      it('should exclude third-party wearables when isSmartWearable=true', async () => {
        const { localFetch, alchemyNftFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=true`)

        // alchemyNftFetcher should not be called when isSmartWearable=true
        expect(alchemyNftFetcher.getNFTsForOwner).not.toHaveBeenCalled()
      })

      it('should work with trimmed response when isSmartWearable=true', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=true&trimmed=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return trimmed smart wearables
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)

        // Verify trimmed structure
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(Object.keys(element)).toEqual(['entity'])
          expect(element.entity).toHaveProperty('metadata')
          expect(element.entity).not.toHaveProperty('version')
        }
      })

      it('should work with sorting when isSmartWearable=true', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(
          `/explorer/${wallet}/wearables?isSmartWearable=true&orderBy=name&direction=asc`
        )

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)
      })
    })

    describe('and isSmartWearable is false', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (not smartWearable)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should return all wearable types when isSmartWearable=false', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=false`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType (not smartWearable)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable'
        })
      })

      it('should return all wearable types when isSmartWearable=0', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=0`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType (not smartWearable)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable'
        })
      })
    })

    describe('and isSmartWearable parameter is not provided', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (default behavior)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      //
      it('should return all wearable types by default', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType (default behavior)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable'
        })
      })
    })

    describe('and isSmartWearable has invalid value', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (default behavior for invalid values)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should treat invalid values as false and return all wearable types', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?isSmartWearable=invalid`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables (treats invalid value as false)
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType (default behavior)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable'
        })
      })
    })
  })

  describe('when network parameter is provided', () => {
    let baseWearables: any[]
    let onChainWearables: any[]
    let thirdPartyWearables: any[]
    let entities: any[]
    let wallet: string

    beforeEach(() => {
      baseWearables = generateBaseWearables(2)
      onChainWearables = generateWearables(2)
      thirdPartyWearables = generateThirdPartyWearables(2)
      entities = generateWearableEntities([
        ...baseWearables.map((wearable) => wearable.urn),
        ...onChainWearables.map((wearable) => wearable.urn),
        ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
      ])
      wallet = generateRandomAddress()
    })

    describe('and network is MATIC', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        // Mock baseWearablesFetcher to not be called when network=MATIC
        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with network: MATIC
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        // Mock thirdPartyWearablesFetcher to not be called when network=MATIC
        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
          pointers.map((pointer) => entities.find((def) => def.id === pointer))
        )
        theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables })
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
      })

      it('should return only polygon wearables (wearable_v2 and smart_wearable_v1)', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables (polygon network includes both wearable_v2 and smart_wearable_v1)
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with network: Network.MATIC
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: Network.MATIC
        })
      })

      it('should exclude base wearables when network=MATIC', async () => {
        const { localFetch, baseWearablesFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC`)

        // baseWearablesFetcher should not be called when network=MATIC
        expect(baseWearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      })

      it('should exclude third-party wearables when network=MATIC', async () => {
        const { localFetch, alchemyNftFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC`)

        // alchemyNftFetcher should not be called when network=MATIC
        expect(alchemyNftFetcher.getNFTsForOwner).not.toHaveBeenCalled()
      })

      it('should work with trimmed response when network=MATIC', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC&trimmed=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return trimmed polygon wearables
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)

        // Verify trimmed structure
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(Object.keys(element)).toEqual(['entity'])
          expect(element.entity).toHaveProperty('metadata')
          expect(element.entity).not.toHaveProperty('version')
        }
      })

      it('should work with sorting when network=MATIC', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC&orderBy=name&direction=asc`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)
      })
    })

    describe('and network is ETHEREUM', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (ethereum wearables)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should return only ethereum on-chain wearables (wearable_v1)', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables (ethereum network = wearable_v1)
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with network: Network.ETHEREUM
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: Network.ETHEREUM
        })
      })

      it('should exclude base wearables when network=ETHEREUM', async () => {
        const { localFetch, baseWearablesFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM`)

        // baseWearablesFetcher should not be called when network=ETHEREUM
        expect(baseWearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      })

      it('should exclude third-party wearables when network=ETHEREUM', async () => {
        const { localFetch, alchemyNftFetcher } = components

        await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM`)

        // alchemyNftFetcher should not be called when network=ETHEREUM
        expect(alchemyNftFetcher.getNFTsForOwner).not.toHaveBeenCalled()
      })

      it('should work with trimmed response when network=ETHEREUM', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM&trimmed=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return trimmed ethereum wearables
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)

        // Verify trimmed structure
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(Object.keys(element)).toEqual(['entity'])
          expect(element.entity).toHaveProperty('metadata')
          expect(element.entity).not.toHaveProperty('version')
        }
      })

      it('should work with sorting when network=ETHEREUM', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM&orderBy=name&direction=asc`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)
      })
    })

    describe('and network parameter is not provided', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (default behavior)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should return all wearable types by default', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType and no network (queries both)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: undefined
        })
      })
    })

    describe('and network has invalid value', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: baseWearables,
          totalAmount: baseWearables.length
        })

        // Mock wearablesFetcher to be called with wearable itemType (default behavior for invalid values)
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        alchemyNftFetcher.getNFTsForOwner = jest
          .fn()
          .mockResolvedValue(thirdPartyWearables.map((wearable) => wearable.urn.decentraland))

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
      })

      it('should treat invalid values as undefined and return all wearable types', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=invalid`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should return all types of wearables (treats invalid value as both networks)
        expect(response.elements).toHaveLength(6) // 2 base + 2 on-chain + 2 third-party
        expect(response.totalAmount).toBe(6)

        // Verify wearablesFetcher was called with wearable itemType and no network (queries both)
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: undefined
        })
      })
    })

    describe('and network uses enum values', () => {
      beforeEach(() => {
        const { baseWearablesFetcher, wearablesFetcher, content, fetch, alchemyNftFetcher, theGraph } = components

        // Mock baseWearablesFetcher to not be called when network is specified
        baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })

        // Mock wearablesFetcher to be called with network filter
        wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: convertWearablesToOnChain(onChainWearables),
          totalAmount: onChainWearables.length
        })

        // Mock thirdPartyWearablesFetcher to not be called when network is specified
        alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
          pointers.map((pointer) => entities.find((def) => def.id === pointer))
        )
        theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
        fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [], total: 0, page: 1 }) })
      })

      it('should accept ETHEREUM enum value', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=ETHEREUM`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with network: Network.ETHEREUM
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: Network.ETHEREUM
        })
      })

      it('should accept MATIC enum value', async () => {
        const { localFetch, wearablesFetcher } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?network=MATIC`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Should only return on-chain wearables
        expect(response.elements).toHaveLength(2)
        expect(response.totalAmount).toBe(2)
        expect(response.elements.every((el: any) => el.type === 'on-chain')).toBe(true)

        // Verify wearablesFetcher was called with network: Network.MATIC
        expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(wallet, undefined, {
          itemType: 'wearable',
          network: Network.MATIC
        })
      })
    })
  })

  describe('when includeAmount parameter is provided', () => {
    let baseWearables: any[]
    let onChainWearables: any[]
    let entities: any[]
    let wallet: string

    beforeEach(() => {
      baseWearables = generateBaseWearables(2)
      onChainWearables = generateWearables(2)
      entities = generateWearableEntities([
        ...baseWearables.map((wearable) => wearable.urn),
        ...onChainWearables.map((wearable) => wearable.urn)
      ])
      wallet = generateRandomAddress()

      const { baseWearablesFetcher, wearablesFetcher, content, theGraph, alchemyNftFetcher } = components

      baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
        elements: baseWearables,
        totalAmount: baseWearables.length
      })

      wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
        elements: convertWearablesToOnChain(onChainWearables),
        totalAmount: onChainWearables.length
      })

      content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
        pointers
          .map((pointer) => entities.find((def) => def.id === pointer))
          .filter((e): e is Entity => e !== undefined)
      )
      theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
      alchemyNftFetcher.getNFTsForOwner = jest.fn().mockResolvedValue([])
    })

    describe('and includeAmount is true with trimmed response', () => {
      it('should include amount field in trimmed response when includeAmount=true', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4) // 2 base + 2 on-chain

        // Verify all elements have amount field
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).toHaveProperty('amount')
          expect(typeof element.amount).toBe('number')
          expect(element.amount).toBeGreaterThanOrEqual(0)
        }
      })

      it('should include amount field when includeAmount=1', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=1`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4)

        // Verify all elements have amount field
        for (const element of response.elements) {
          expect(element).toHaveProperty('amount')
          expect(typeof element.amount).toBe('number')
        }
      })

      it('should calculate amount correctly from individualData length', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Base wearables have 1 item each
        const baseElements = response.elements.slice(0, 2)
        for (const element of baseElements) {
          expect(element.amount).toBe(1)
        }

        // On-chain wearables have 1 item each in this mock
        const onChainElements = response.elements.slice(2, 4)
        for (const element of onChainElements) {
          expect(element.amount).toBe(1)
        }
      })
    })

    describe('and includeAmount is false or not provided with trimmed response', () => {
      it('should not include amount field when includeAmount=false', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=false`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4)

        // Verify no elements have amount field
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).not.toHaveProperty('amount')
        }
      })

      it('should not include amount field when includeAmount is not provided', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4)

        // Verify no elements have amount field by default
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).not.toHaveProperty('amount')
        }
      })

      it('should not include amount field when includeAmount=0', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=0`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4)

        // Verify no elements have amount field
        for (const element of response.elements) {
          expect(element).not.toHaveProperty('amount')
        }
      })

      it('should treat invalid includeAmount values as false', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=invalid`)

        expect(r.status).toBe(200)
        const response = await r.json()

        expect(response.elements).toHaveLength(4)

        // Verify no elements have amount field with invalid value
        for (const element of response.elements) {
          expect(element).not.toHaveProperty('amount')
        }
      })
    })

    describe('and includeAmount is used with non-trimmed response', () => {
      it('should already have amount in non-trimmed response regardless of includeAmount', async () => {
        const { localFetch } = components

        const r1 = await localFetch.fetch(`/explorer/${wallet}/wearables?includeAmount=true`)
        const r2 = await localFetch.fetch(`/explorer/${wallet}/wearables?includeAmount=false`)
        const r3 = await localFetch.fetch(`/explorer/${wallet}/wearables`)

        expect(r1.status).toBe(200)
        expect(r2.status).toBe(200)
        expect(r3.status).toBe(200)

        const response1 = await r1.json()
        const response2 = await r2.json()
        const response3 = await r3.json()

        // All non-trimmed responses should have amount field
        for (const element of response1.elements) {
          expect(element).toHaveProperty('amount')
        }
        for (const element of response2.elements) {
          expect(element).toHaveProperty('amount')
        }
        for (const element of response3.elements) {
          expect(element).toHaveProperty('amount')
        }
      })
    })

    describe('and includeAmount is combined with other filters', () => {
      it('should work with includeAmount and isSmartWearable', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(
          `/explorer/${wallet}/wearables?trimmed=true&includeAmount=true&isSmartWearable=true`
        )

        expect(r.status).toBe(200)
        const response = await r.json()

        // Verify elements have both trimmed structure and amount
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).toHaveProperty('amount')
          expect(Object.keys(element).sort()).toEqual(['amount', 'entity'])
        }
      })

      it('should work with includeAmount and network=MATIC', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/explorer/${wallet}/wearables?trimmed=true&includeAmount=true&network=MATIC`)

        expect(r.status).toBe(200)
        const response = await r.json()

        // Verify elements have both trimmed structure and amount
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).toHaveProperty('amount')
        }
      })

      it('should work with includeAmount and sorting', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(
          `/explorer/${wallet}/wearables?trimmed=true&includeAmount=true&orderBy=name&direction=asc`
        )

        expect(r.status).toBe(200)
        const response = await r.json()

        // Verify elements have both trimmed structure and amount
        for (const element of response.elements) {
          expect(element).toHaveProperty('entity')
          expect(element).toHaveProperty('amount')
        }
      })
    })
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

function convertWearablesToOnChain(wearables: WearableFromQuery[]): any[] {
  return wearables.map((wearable) => ({
    urn: wearable.urn,
    amount: 1,
    individualData: [
      {
        id: `${wearable.urn}:${wearable.tokenId}`,
        tokenId: wearable.tokenId,
        transferredAt: wearable.transferredAt,
        price: wearable.item.price
      }
    ],
    name: wearable.metadata.wearable.name,
    rarity: wearable.item.rarity,
    minTransferredAt: wearable.transferredAt,
    maxTransferredAt: wearable.transferredAt,
    category: wearable.metadata.wearable.category
  }))
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

function convertToMixedThirdPartyWearableResponse(
  wearables: any[],
  { entities }: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const entity = entities.find((def) => def.id === wearable.urn.decentraland)
    return {
      type: 'third-party',
      urn: wearable.urn.decentraland,
      amount: wearable.amount,
      individualData: [
        {
          id: `${wearable.urn.decentraland}:${wearable.urn.tokenId}`,
          tokenId: wearable.urn.tokenId
        }
      ],
      category: entity.metadata.data.category,
      name: entity.metadata.name,
      entity: entity
    }
  })
}
