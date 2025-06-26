import { Entity, WearableCategory } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../src/adapters/definitions'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { SORTED_RARITIES } from '../../src/logic/utils'
import { OnChainWearableResponse } from '../../src/types'
import { test } from '../components'
import { generateWearableEntities, generateWearables } from '../data/wearables'
import { createMockProfileWearable } from '../mocks/dapps-db-mock'

import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache
test('wearables-handler: GET /users/:address/wearables should', function ({ components }) {
  // Helper function to convert WearableFromQuery to ProfileWearable
  function convertToProfileWearables(wearables: WearableFromQuery[]) {
    return wearables.map((w) =>
      createMockProfileWearable({
        urn: w.urn,
        name: w.metadata.wearable.name,
        category: w.metadata.wearable.category,
        rarity: w.item.rarity,
        tokenId: w.tokenId,
        transferredAt: w.transferredAt,
        price: w.item.price,
        id: `${w.urn}:${w.tokenId}`,
        individualData: [
          {
            id: `${w.urn}:${w.tokenId}`,
            tokenId: w.tokenId,
            transferredAt: w.transferredAt,
            price: w.item.price
          }
        ],
        amount: 1,
        minTransferredAt: w.transferredAt,
        maxTransferredAt: w.transferredAt
      })
    )
  }

  it('return empty when no wearables are found', async () => {
    const { localFetch, dappsDb } = components

    // Mock dappsDb to return empty array
    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue([])

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
    const { localFetch, dappsDb, content } = components

    // Mock dappsDb to return empty array
    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue([])
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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(1)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(1)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(2)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn))

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)
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
    const { localFetch, dappsDb, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities(wearables.map((wearable) => wearable.urn))

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)
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
    const { localFetch, dappsDb, content, contentServerUrl } = components
    const wearables = generateWearables(2)
    const entities = generateWearableEntities([wearables[0].urn])

    // modify wearable urn to avoid cache hit
    wearables[1] = { ...wearables[1], urn: 'anotherUrn' }

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)
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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(4)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(4)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(4)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(4)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(7)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(7)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(7)

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=3&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel([wearables[6]])].sort(rarest),
      pageNum: 3,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables filtering by name', async () => {
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(17)
    const wallet = generateRandomAddress()

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
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

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: i % 2 === 0 ? 'unique' : 'mythic'
      }
    }))

    const wallet = generateRandomAddress()

    const profileWearables = convertToProfileWearables(wearables)
    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

    const r = await localFetch.fetch(`/users/${wallet}/wearables?pageSize=20&pageNum=1&rarity=mythic`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 1)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 8
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
      elements: [...convertToDataModel(wearables).filter((w, i) => i % 2 === 0)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 9
    })
  })

  it('return wearables from cache on second call for the same address (case insensitive)', async () => {
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(7)
    const wallet = generateRandomAddress()

    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest
      .fn()
      .mockResolvedValueOnce(profileWearables)
      .mockResolvedValueOnce(profileWearables)

    const r = await localFetch.fetch(`/users/${wallet}/wearables?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: convertToDataModel(wearables),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/wearables?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
  })

  it('return wearables sorted by newest / oldest', async () => {
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      transferredAt: w.transferredAt + i
    }))

    const wallet = generateRandomAddress()

    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: SORTED_RARITIES[i % SORTED_RARITIES.length]
      }
    }))

    const wallet = generateRandomAddress()

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components
    const wearables = generateWearables(17)

    const wallet = generateRandomAddress()

    // Convert to ProfileWearable format
    const profileWearables = convertToProfileWearables(wearables)

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValue(profileWearables)

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
    const { localFetch, dappsDb } = components

    dappsDb.getWearablesByOwner = jest
      .fn()
      .mockRejectedValueOnce(new Error(`GraphQL Error: Invalid response. Errors:\n- some error. Provider: ethereum`))

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${wallet}/wearables`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })

  it('return an error when wearables cannot be fetched from matic collection', async () => {
    const { localFetch, dappsDb } = components

    dappsDb.getWearablesByOwner = jest
      .fn()
      .mockRejectedValueOnce(new Error(`GraphQL Error: Invalid response. Errors:\n- some error. Provider: dappsDb`))

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${wallet}/wearables`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })

  it('return a generic error when an unexpected error occurs (definitions cannot be fetched)', async () => {
    const { localFetch, dappsDb, content } = components
    const wearables = generateWearables(2)

    // modify wearable urn to avoid cache hit
    wearables[1] = { ...wearables[1], urn: 'anotherUrn' }

    dappsDb.getWearablesByOwner = jest.fn().mockResolvedValueOnce(convertToProfileWearables(wearables))
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
