import { Entity } from '@dcl/schemas'
import Wallet from 'ethereumjs-wallet'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { ContentComponent } from '../../src/ports/content'
import { testWithComponents } from '../components'
import {
  generateBaseWearables,
  generateThirdPartyWearables,
  generateWearableContentDefinitions,
  generateWearables,
  getThirdPartyProviders
} from '../data/wearables'

import { MixedWearableResponse } from '../../src/controllers/handlers/explorer-handler'
import { leastRareOptional, nameAZ, nameZA, rarestOptional } from '../../src/logic/sorting'
import { BaseWearable, ThirdPartyAsset } from '../../src/types'
import { createTheGraphComponentMock } from '../mocks/the-graph-mock'
import { extractWearableDefinitionFromEntity } from '../../src/adapters/definitions'

type ContentInfo = {
  definitions: Entity[]
  content: ContentComponent
}

testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = getThirdPartyProviders()

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('wearables-handler: GET /explorer-service/backpack/:address/wearables', function ({ components }) {
  it('return descriptive errors for bad requests', async () => {
    const { baseWearablesFetcher, content, fetch, localFetch, theGraph } = components

    const wallet = Wallet.generate().getAddressString()

    const r = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?collectionType=fourth-party`)
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({
      error: 'Bad request',
      message: 'Invalid collection type. Valid types are: base-wearable, on-chain, third-party.'
    })

    const r2 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=owner`)
    expect(r2.status).toBe(400)
    expect(await r2.json()).toEqual({
      error: 'Bad request',
      message: "Invalid sorting requested: 'owner DESC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
    })

    const r3 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=rarity&direction=INC`)
    expect(r3.status).toBe(400)
    expect(await r3.json()).toEqual({
      error: 'Bad request',
      message: "Invalid sorting requested: 'rarity INC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
    })

    const r4 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?rarity=espectacular`)
    expect(r4.status).toBe(400)
    expect(await r4.json()).toEqual({
      error: 'Bad request',
      message: "Invalid rarity requested: 'espectacular'."
    })
  })

  it('return only base wearables when no on-chain or third-party found', async () => {
    const { baseWearablesFetcher, content, fetch, localFetch, theGraph } = components

    const baseWearables = generateBaseWearables(278)
    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })
    const definitions = generateWearableContentDefinitions(baseWearables.map((wearable) => wearable.urn))
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => definitions.find((def) => def.id === pointer))
    )
    fetch.fetch = jest.fn().mockImplementation(() => {
      return { ok: true, json: () => ({ assets: [] }) }
    })

    const wallet = Wallet.generate().getAddressString()
    const r = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({
      pageNum: 1,
      totalAmount: 278,
      pageSize: 100
    })
  })

  it('return base + on-chain + third-party wearables', async () => {
    const { content, fetch, localFetch, theGraph, baseWearablesFetcher } = components
    const baseWearables = generateBaseWearables(2)
    const onChainWearables = generateWearables(2)
    const thirdPartyWearables = generateThirdPartyWearables(2)
    const definitions = generateWearableContentDefinitions([
      ...baseWearables.map((wearable) => wearable.urn),
      ...onChainWearables.map((wearable) => wearable.urn),
      ...thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    ])

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
      pointers.map((pointer) => definitions.find((def) => def.id === pointer))
    )
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('babydoge')) {
        return {
          ok: true,
          json: () => ({
            assets: thirdPartyWearables
          })
        }
      } else {
        return { ok: true, json: () => ({ assets: [] }) }
      }
    })

    const convertedMixedBaseWearables = convertToMixedBaseWearable(baseWearables)
    const convertedMixedOnChainWearables = convertToMixedOnChainWearable(onChainWearables, { definitions, content })
    const convertedMixedThirdPartyWearables = convertToMixedThirdPartyWearable(thirdPartyWearables, {
      definitions,
      content
    })

    const wallet = Wallet.generate().getAddressString()
    const r = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [
        ...convertedMixedBaseWearables,
        ...convertedMixedOnChainWearables,
        ...convertedMixedThirdPartyWearables
      ].sort(rarestOptional),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r3 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=rarity&direction=desc`)
    expect(r3.status).toBe(200)
    expect(await r3.json()).toEqual({
      elements: [
        ...convertedMixedBaseWearables,
        ...convertedMixedOnChainWearables,
        ...convertedMixedThirdPartyWearables
      ].sort(rarestOptional),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r4 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=rarity&direction=asc`)
    expect(r4.status).toBe(200)
    expect(await r4.json()).toEqual({
      elements: [
        ...convertedMixedBaseWearables,
        ...convertedMixedOnChainWearables,
        ...convertedMixedThirdPartyWearables
      ].sort(leastRareOptional),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r5 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=name&direction=asc`)
    expect(r5.status).toBe(200)
    expect(await r5.json()).toEqual({
      elements: [
        ...convertedMixedBaseWearables,
        ...convertedMixedOnChainWearables,
        ...convertedMixedThirdPartyWearables
      ].sort(nameAZ),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r6 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=name&direction=desc`)
    expect(r6.status).toBe(200)
    expect(await r6.json()).toEqual({
      elements: [
        ...convertedMixedBaseWearables,
        ...convertedMixedOnChainWearables,
        ...convertedMixedThirdPartyWearables
      ].sort(nameZA),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r7 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=date&direction=asc`)
    expect(r7.status).toBe(200)
    expect(await r7.json()).toEqual({
      elements: [
        convertedMixedThirdPartyWearables[0],
        convertedMixedThirdPartyWearables[1],
        convertedMixedBaseWearables[0],
        convertedMixedBaseWearables[1],
        convertedMixedOnChainWearables[0],
        convertedMixedOnChainWearables[1]
      ], // sorting is hard-coded here as we can not sort on mixed items because they don't have minTransferredAt / maxTransferredAt
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r8 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?orderBy=date&direction=desc`)
    expect(r8.status).toBe(200)
    expect(await r8.json()).toEqual({
      elements: [
        convertedMixedOnChainWearables[1],
        convertedMixedOnChainWearables[0],
        convertedMixedThirdPartyWearables[0],
        convertedMixedThirdPartyWearables[1],
        convertedMixedBaseWearables[0],
        convertedMixedBaseWearables[1]
      ], // sorting is hard-coded here as we can not sort on mixed items because they don't have minTransferredAt / maxTransferredAt
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })

    const r9 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?name=1`)
    expect(r9.status).toBe(200)
    expect(await r9.json()).toEqual({
      elements: [convertedMixedOnChainWearables[1], convertedMixedThirdPartyWearables[1]],
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })

    const r10 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?category=eyewear`)
    expect(r10.status).toBe(200)
    expect(await r10.json()).toEqual({
      elements: [convertedMixedOnChainWearables[0], convertedMixedOnChainWearables[1]],
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })

    const r11 = await localFetch.fetch(
      `/explorer-service/backpack/${wallet}/wearables?category=earring&category=body_shape`
    )
    expect(r11.status).toBe(200)
    expect(await r11.json()).toEqual({
      elements: [
        convertedMixedThirdPartyWearables[0],
        convertedMixedThirdPartyWearables[1],
        convertedMixedBaseWearables[0],
        convertedMixedBaseWearables[1]
      ],
      pageNum: 1,
      pageSize: 100,
      totalAmount: 4
    })

    const r12 = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables?rarity=unique`)
    expect(r12.status).toBe(200)
    expect(await r12.json()).toEqual({
      elements: [convertedMixedOnChainWearables[0], convertedMixedOnChainWearables[1]],
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })
})

function convertToMixedBaseWearable(wearables: BaseWearable[]): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
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
      definition: wearable.definition
    }
  })
}

function convertToMixedOnChainWearable(
  wearables: WearableFromQuery[],
  contentInfo?: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const individualData = {
      id: wearable.id,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    const rarity = wearable.item.rarity
    const definition = contentInfo?.definitions.find((def) => def.id === wearable.urn)
    const content = contentInfo?.content

    return {
      type: 'on-chain',
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      definition: definition && content ? extractWearableDefinitionFromEntity({ content }, definition) : undefined
    }
  })
}

function convertToMixedThirdPartyWearable(
  wearables: ThirdPartyAsset[],
  contentInfo?: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const definition = contentInfo?.definitions.find((def) => def.id === wearable.urn.decentraland)
    const content = contentInfo?.content
    return {
      type: 'third-party',
      urn: wearable.urn.decentraland,
      amount: 1,
      individualData: [
        {
          id: wearable.id
        }
      ],
      category: definition.metadata.data.category,
      name: definition.metadata.name,
      definition: definition && content ? extractWearableDefinitionFromEntity({ content }, definition) : undefined
    }
  })
}
