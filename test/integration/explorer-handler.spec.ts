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
import { BASE_WEARABLES } from '../../src/logic/fetch-elements/fetch-base-items'
import { rarestOptional } from '../../src/logic/sorting'
import { BaseWearable, ThirdPartyWearable } from '../../src/types'
import { createTheGraphComponentMock } from '../mocks/the-graph-mock'

testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = getThirdPartyProviders()

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('wearables-handler: GET /explorer-service/backpack/:address/wearables', function ({ components }) {
  it('return only base wearables when no on-chain or third-party found', async () => {
    const { content, fetch, localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })
    const definitions = generateWearableContentDefinitions(BASE_WEARABLES)
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)

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
    const baseWearables = generateBaseWearables(0)
    const onChainWearables = generateWearables(2)
    const thirdPartyWearables = generateThirdPartyWearables(0)

    baseWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(baseWearables)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) => {
      return generateWearableContentDefinitions(pointers)
    })
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

    const wallet = Wallet.generate().getAddressString()
    const r = await localFetch.fetch(`/explorer-service/backpack/${wallet}/wearables`)

    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body).toEqual({
      elements: [
        ...convertToMixedBaseWearable(baseWearables),
        ...convertToMixedOnChainWearable(onChainWearables)
        // ...convertToMixedThirdPartyWearable(thirdPartyWearables)
      ]
        // .filter(hasRarity)
        .sort(rarestOptional),
      pageNum: 1,
      pageSize: 100,
      totalAmount: baseWearables.length + onChainWearables.length + thirdPartyWearables.length
    })
  })
})

type ContentInfo = {
  definitions: Entity[]
  content: ContentComponent
}

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

function convertToMixedOnChainWearable(wearables: WearableFromQuery[]): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const individualData = {
      id: wearable.id,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    const rarity = wearable.item.rarity
    const entity = generateWearableContentDefinitions([wearable.urn])[0]
    return {
      type: 'on-chain',
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      definition: entity.metadata
    }
  })
}

function convertToMixedThirdPartyWearable(
  wearables: ThirdPartyWearable[],
  contentInfo?: ContentInfo
): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const entity = generateWearableContentDefinitions([wearable.urn])
    return {
      type: 'third-party',
      urn: wearable.urn,
      amount: 1,
      individualData: [
        {
          id: wearable.urn
        }
      ],
      category: wearable.category,
      name: wearable.name
      // definition: entity[0].metadata
    }
  })
}

function hasRarity<T>(item: T & { rarity: string }): item is T & { rarity: string } {
  return item.rarity !== undefined
}

function convertBaseWearableToItemResponse() {}
