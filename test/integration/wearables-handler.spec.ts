import { Entity, WearableCategory } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../src/adapters/definitions'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { RARITIES } from '../../src/logic/utils'
import { OnChainWearableResponse } from '../../src/types'
import { test } from '../components'
import { generateWearableEntities, generateWearables } from '../data/wearables'

import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache
test('wearables-handler: GET /users/:address/wearables should', function ({ components }) {
  it('return empty when no wearables are found', async () => {
    const { localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return empty when no wearables are found with includeDefinitions set', async () => {
    const { localFetch, theGraph, content } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce([])

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return a wearable from ethereum collection', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(1)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return a wearable from matic collection', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(1)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return wearables from both collections', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(2)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[1]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return wearables from both collections with includeDefinitions set', async () => {
    const { localFetch, theGraph, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[1]] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(entities)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables, { entities, contentServerUrl, includeDefinition: true })].sort(
        rarest
      ),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return wearables from both collections with includeEntities set', async () => {
    const { localFetch, theGraph, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[1]] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(entities)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeEntities`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables, { entities, contentServerUrl, includeEntity: true })].sort(rarest),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return a wearable with definition and another one without definition', async () => {
    const { localFetch, theGraph, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities([wearables[0].urn])

    // modify wearable urn to avoid cache hit
    wearables[1] = { ...wearables[1], urn: 'anotherUrn' }

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[1]] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(entities)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables, { entities, contentServerUrl, includeDefinition: true })].sort(
        rarest
      ),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return wearables 2 from each collection and paginate them correctly (page 1, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[2], wearables[3]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[0], wearables[1]])].sort(rarest),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables 2 from each collection and paginate them correctly (page 2, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[2], wearables[3]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[2], wearables[3]])].sort(rarest),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (3 eth and 1 matic) and paginate them correctly (page 1, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[3]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[0], wearables[1]])].sort(rarest),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (3 eth and 1 matic) and paginate them correctly (page 2, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[3]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[2], wearables[3]])].sort(rarest),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 1, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=3&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[0], wearables[1], wearables[2]])].sort(rarest),
      pageNum: 1,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 2, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=3&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[3], wearables[4], wearables[5]])].sort(rarest),
      pageNum: 2,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 3, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=3&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[6]])].sort(rarest),
      pageNum: 3,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables from cache on second call for the same address', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)
    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/wearables?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
    expect(theGraph.ethereumCollectionsSubgraph.query).toHaveBeenCalledTimes(1)
    expect(theGraph.maticCollectionsSubgraph.query).toHaveBeenCalledTimes(1)
  })

  it('return wearables filtering by name', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(17)
    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&name=3`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: [convertToDataModel(wearables)[13], convertToDataModel(wearables)[3]],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 2
    })
  })

  it('return wearables filtering by category', async () => {
    const { localFetch, theGraph } = components
    const wearables: WearableFromQuery[] = generateWearables(17).map((w, i) => ({
      ...w,
      metadata: {
        wearable: {
          name: 'name-' + i,
          category: i % 2 === 0 ? WearableCategory.UPPER_BODY : WearableCategory.LOWER_BODY
        }
      }
    }))

    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&category=upper_body`
    )
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 0)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 9
    })

    const r2 = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&category=lower_body`
    )
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 1)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 8
    })

    const r3 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&category=head`)
    expect(r3.status).toBe(200)
    expect(await r3.json()).toEqual({
      elements: [],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 0
    })

    const r4 = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&category=lower_body&category=upper_body`
    )
    expect(r4.status).toBe(200)
    expect(await r4.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return wearables filtering by rarity', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: i % 2 === 0 ? 'rare' : 'mythic'
      }
    }))
    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&rarity=rare`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 0)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 9
    })

    const r2 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&rarity=mythic`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 1)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 8
    })

    const r3 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&rarity=unique`)
    expect(r3.status).toBe(200)
    expect(await r3.json()).toEqual({
      elements: [],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 0
    })
  })

  it('return wearables sorted by newest / oldest', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      transferredAt: w.transferredAt + i
    }))

    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&orderBy=date&direction=DESC`
    )
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].reverse(),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&orderBy=date&direction=ASC`
    )
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(wearables)],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return wearables sorted by rarest / least_rare', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: RARITIES[i % RARITIES.length]
      }
    }))

    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&rarity&direction=DESC`
    )
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&orderBy=rarity&direction=ASC`
    )
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(leastRare),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return wearables sorted by name asc / desc', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(17)

    const wallet = generateRandomAddress()

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: wearables })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&orderBy=name&direction=ASC`
    )
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(nameAZ),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(
      `/users/${wallet.toUpperCase()}/wearables?pageSize=20&pageNum=1&orderBy=name&direction=DESC`
    )
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(wearables)].sort(nameZA),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return an error when wearables cannot be fetched from ethereum collection', async () => {
    const { localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest
      .fn()
      .mockRejectedValueOnce(new Error(`GraphQL Error: Invalid response. Errors:\n- some error. Provider: ethereum`))
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${wallet}/wearables`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'The requested items cannot be fetched right now',
      message: `Cannot fetch elements for ${wallet}`
    })
  })

  it('return an error when wearables cannot be fetched from matic collection', async () => {
    const { localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockRejectedValueOnce(new Error(`GraphQL Error: Invalid response. Errors:\n- some error. Provider: matic`))

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${wallet}/wearables`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'The requested items cannot be fetched right now',
      message: `Cannot fetch elements for ${wallet}`
    })
  })

  it('return a generic error when an unexpected error occurs (definitions cannot be fetched)', async () => {
    const { localFetch, theGraph, content } = components
    const wearables = generateWearables(2)

    // modify wearable urn to avoid cache hit
    wearables[1] = { ...wearables[1], urn: 'anotherUrn' }

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[1]] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(undefined)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })
})

type ContentInfo = {
  entities: Entity[]
  contentServerUrl: string
  includeEntity?: boolean
  includeDefinition?: boolean
}

function convertToDataModel(wearables: WearableFromQuery[], contentInfo?: ContentInfo): OnChainWearableResponse[] {
  return wearables.map((wearable): OnChainWearableResponse => {
    const individualData = {
      id: `${wearable.urn}:${wearable.tokenId}`,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    const rarity = wearable.item.rarity
    const entity = contentInfo?.entities.find((def) => def.id === wearable.urn)
    const contentServerUrl = contentInfo?.contentServerUrl
    return {
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      definition:
        contentInfo?.includeDefinition && entity
          ? extractWearableDefinitionFromEntity({ contentServerUrl }, entity)
          : undefined,
      entity: contentInfo?.includeEntity && entity ? entity : undefined
    }
  })
}
