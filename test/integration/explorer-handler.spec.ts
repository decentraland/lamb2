import { Entity } from '@dcl/schemas'
import Wallet from 'ethereumjs-wallet'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { ContentComponent } from '../../src/ports/content'
import { testWithComponents } from '../components'
import {
  generateThirdPartyWearables,
  generateWearableContentDefinitions,
  generateWearables,
  getThirdPartyProviders
} from '../data/wearables'

import { MixedWearableResponse } from '../../src/controllers/handlers/explorer-handler'
import { BASE_WEARABLES } from '../../src/logic/fetch-elements/fetch-base-items'
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

    const r = await localFetch.fetch(`/explorer-service/backpack/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({
      pageNum: 1,
      totalAmount: 278,
      pageSize: 100
    })
  })

  it.only('return base + on-chain + third-party wearables', async () => {
    const { content, fetch, localFetch, theGraph } = components
    const onChainWearables = generateWearables(10)
    const thirdPartyWearables = generateThirdPartyWearables(2)
    // jest.spyOn(baseItems, 'BASE_WEARABLES').mockReturnValue(['urn:decentraland:off-chain:base-avatars:BaseFemale', 'urn:decentraland:off-chain:base-avatars:BaseMale'])
    // Object.defineProperty(baseItems, 'BASE_WEARABLES', [])
    // const baseWearableIds = ['baseWearable1', 'baseWearable2']
    // const baseWearables = generateBaseWearables(BASE_WEARABLES)

    // const baseWearableDefinitions = baseWearables.map((wearable) => wearable.definition)

    // const definitions = generateWearableContentDefinitions(
    //   BASE_WEARABLES.concat(onChainWearables.map((wearable) => wearable.urn)).concat(
    //     thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
    //   )
    // )

    // const baseWearableDefinitions = generateWearableContentDefinitions(
    // content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.fetchEntitiesByPointers = jest.fn(async (pointers) => {
      return generateWearableContentDefinitions(pointers)
    })
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: onChainWearables.slice(5, 10) })
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

    const r = await localFetch.fetch(`/explorer-service/backpack/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    // const body = await r.json()
    // expect(body).toEqual({
    //   elements: [...convertToMixedOnChainWearable(onChainWearables), ...convertToMixedOnChainWearable(onChainWearables).filter(hasRarity).sort(rarest)],
    //   pageNum: 1,
    //   pageSize: 100,
    //   totalAmount: BASE_WEARABLES.length + onChainWearables.length + thirdPartyWearables.length
    // })
  })
})

function hasRarity<T>(item: T & { rarity: string }): item is T & { rarity: string } {
  return item.rarity !== undefined
}

type ContentInfo = {
  definitions: Entity[]
  content: ContentComponent
}

function convertToMixedOnChainWearable(wearables: WearableFromQuery[], contentInfo?: ContentInfo): MixedWearableResponse[] {
  return wearables.map((wearable): MixedWearableResponse => {
    const individualData = {
      id: wearable.id,
      tokenId: wearable.tokenId,
      transferredAt: wearable.transferredAt,
      price: wearable.item.price
    }
    const rarity = wearable.item.rarity
    // const definition = contentInfo?.definitions.find((def) => def.id === wearable.urn)
    // const content = contentInfo?.content
    const entity = generateWearableContentDefinitions([wearable.urn])
    return {
      type: 'on-chain',
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      // definition: definition && content ? extractWearableDefinitionFromEntity({ content }, definition) : undefined
      definition: entity[0].metadata
    }
  })
}

function convertBaseWearableToItemResponse() { }
