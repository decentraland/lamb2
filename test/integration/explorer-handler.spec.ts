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

    // Build proxy items with the fields used by sorting, then derive expected ids
    const proxyBase = baseWearables.map((wearable) => {
      const entity = entities.find((def) => def.id === wearable.urn) as Entity
      return {
        type: 'base-wearable',
        urn: wearable.urn,
        name: wearable.name,
        category: wearable.category,
        rarity: (entity.metadata as any)?.rarity,
        entityId: entity.id
      }
    })
    const proxyOnChain = onChainWearables.map((wearable) => {
      const entity = entities.find((def) => def.id === wearable.urn) as Entity
      return {
        type: 'on-chain',
        urn: wearable.urn,
        name: wearable.metadata.wearable.name,
        category: wearable.metadata.wearable.category,
        rarity: wearable.item.rarity,
        transferredAt: wearable.transferredAt,
        entityId: entity.id
      }
    })
    const proxyThirdParty = thirdPartyWearables.map((wearable) => {
      const entity = entities.find((def) => def.id === wearable.urn.decentraland) as Entity
      return {
        type: 'third-party',
        urn: wearable.urn.decentraland,
        name: (entity.metadata as any)?.name,
        category: (entity.metadata as any)?.data?.category,
        rarity: (entity.metadata as any)?.rarity,
        entityId: entity.id
      }
    })
    const allProxies = [...proxyBase, ...proxyOnChain, ...proxyThirdParty]

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/explorer/${wallet}/wearables`)
    expect(r.status).toBe(200)
    const body = await r.json()
    const receivedIds = body.elements.map((e: any) => e.entity.id)
    const expectedIds = [...allProxies].sort(rarestOptional as any).map((p) => p.entityId)
    expect(receivedIds).toEqual(expectedIds)
    expect(body.pageNum).toBe(1)
    expect(body.pageSize).toBe(100)
    expect(body.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r3 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=rarity&direction=desc`)
    expect(r3.status).toBe(200)
    const body3 = await r3.json()
    const receivedIds3 = body3.elements.map((e: any) => e.entity.id)
    const expectedIds3 = [...allProxies].sort(rarestOptional as any).map((p) => p.entityId)
    expect(receivedIds3).toEqual(expectedIds3)
    expect(body3.pageNum).toBe(1)
    expect(body3.pageSize).toBe(100)
    expect(body3.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r4 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=rarity&direction=asc`)
    expect(r4.status).toBe(200)
    const body4 = await r4.json()
    const receivedIds4 = body4.elements.map((e: any) => e.entity.id)
    const expectedIds4 = [...allProxies].sort(leastRareOptional as any).map((p) => p.entityId)
    expect(receivedIds4).toEqual(expectedIds4)
    expect(body4.pageNum).toBe(1)
    expect(body4.pageSize).toBe(100)
    expect(body4.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r5 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=name&direction=asc`)
    expect(r5.status).toBe(200)
    const body5 = await r5.json()
    const receivedIds5 = body5.elements.map((e: any) => e.entity.id)
    const expectedIds5 = [...allProxies].sort(nameAZ as any).map((p) => p.entityId)
    expect(receivedIds5).toEqual(expectedIds5)
    expect(body5.pageNum).toBe(1)
    expect(body5.pageSize).toBe(100)
    expect(body5.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r6 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=name&direction=desc`)
    expect(r6.status).toBe(200)
    const body6 = await r6.json()
    const receivedIds6 = body6.elements.map((e: any) => e.entity.id)
    const expectedIds6 = [...allProxies].sort(nameZA as any).map((p) => p.entityId)
    expect(receivedIds6).toEqual(expectedIds6)
    expect(body6.pageNum).toBe(1)
    expect(body6.pageSize).toBe(100)
    expect(body6.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r7 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=date&direction=asc`)
    expect(r7.status).toBe(200)
    const body7 = await r7.json()
    const receivedIds7 = body7.elements.map((e: any) => e.entity.id)
    const expectedIds7 = [
      proxyThirdParty[0].entityId,
      proxyThirdParty[1].entityId,
      proxyBase[0].entityId,
      proxyBase[1].entityId,
      proxyOnChain[0].entityId,
      proxyOnChain[1].entityId
    ]
    expect(receivedIds7).toEqual(expectedIds7)
    expect(body7.pageNum).toBe(1)
    expect(body7.pageSize).toBe(100)
    expect(body7.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r8 = await localFetch.fetch(`/explorer/${wallet}/wearables?orderBy=date&direction=desc`)
    expect(r8.status).toBe(200)
    const body8 = await r8.json()
    const receivedIds8 = body8.elements.map((e: any) => e.entity.id)
    const expectedIds8 = [
      proxyOnChain[1].entityId,
      proxyOnChain[0].entityId,
      proxyThirdParty[0].entityId,
      proxyThirdParty[1].entityId,
      proxyBase[0].entityId,
      proxyBase[1].entityId
    ]
    expect(receivedIds8).toEqual(expectedIds8)
    expect(body8.pageNum).toBe(1)
    expect(body8.pageSize).toBe(100)
    expect(body8.totalAmount).toBe(baseWearables.length + onChainWearables.length + thirdPartyWearables.length)

    const r9 = await localFetch.fetch(`/explorer/${wallet}/wearables?name=1`)
    expect(r9.status).toBe(200)
    const body9 = await r9.json()
    const receivedIds9 = body9.elements.map((e: any) => e.entity.id)
    const expectedIds9 = [proxyOnChain[1].entityId, proxyThirdParty[1].entityId]
    expect(receivedIds9).toEqual(expectedIds9)
    expect(body9.pageNum).toBe(1)
    expect(body9.pageSize).toBe(100)
    expect(body9.totalAmount).toBe(2)

    const r10 = await localFetch.fetch(`/explorer/${wallet}/wearables?category=eyewear`)
    expect(r10.status).toBe(200)
    const body10 = await r10.json()
    const receivedIds10 = body10.elements.map((e: any) => e.entity.id)
    const expectedIds10 = [proxyOnChain[0].entityId, proxyOnChain[1].entityId]
    expect(receivedIds10).toEqual(expectedIds10)
    expect(body10.pageNum).toBe(1)
    expect(body10.pageSize).toBe(100)
    expect(body10.totalAmount).toBe(2)

    const r11 = await localFetch.fetch(`/explorer/${wallet}/wearables?category=earring&category=body_shape`)
    expect(r11.status).toBe(200)
    const body11 = await r11.json()
    const receivedIds11 = body11.elements.map((e: any) => e.entity.id)
    const expectedIds11 = [
      proxyThirdParty[0].entityId,
      proxyThirdParty[1].entityId,
      proxyBase[0].entityId,
      proxyBase[1].entityId
    ]
    expect(receivedIds11).toEqual(expectedIds11)
    expect(body11.pageNum).toBe(1)
    expect(body11.pageSize).toBe(100)
    expect(body11.totalAmount).toBe(4)

    const r12 = await localFetch.fetch(`/explorer/${wallet}/wearables?rarity=unique`)
    expect(r12.status).toBe(200)
    const body12 = await r12.json()
    const receivedIds12 = body12.elements.map((e: any) => e.entity.id)
    const expectedIds12 = [proxyOnChain[0].entityId, proxyOnChain[1].entityId]
    expect(receivedIds12).toEqual(expectedIds12)
    expect(body12.pageNum).toBe(1)
    expect(body12.pageSize).toBe(100)
    expect(body12.totalAmount).toBe(2)
  })
})

function convertToMixedBaseWearableResponse(
  wearables: BaseWearable[],
  contentInfo: ContentInfo
): any[] {
  return wearables.map((wearable): any => {
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
      entity
    }
  })
}

function convertToMixedOnChainWearableResponse(
  wearables: WearableFromQuery[],
  { entities }: ContentInfo
): any[] {
  return wearables.map((wearable): any => {
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
      entity
    }
  })
}

function convertToMixedThirdPartyWearableResponse(wearables: any[], { entities }: ContentInfo): any[] {
  return wearables.map((wearable): any => {
    const entity = entities.find((def) => def.id === wearable.urn.decentraland)
    return {
      type: 'third-party',
      urn: wearable.urn.decentraland,
      amount: 1,
      individualData: [
        {
          id: wearable.urn.decentraland + ':' + wearable.urn.tokenId,
          tokenId: wearable.urn.tokenId
        }
      ],
      category: entity.metadata.data.category,
      name: entity.metadata.name,
      entity
    }
  })
}
