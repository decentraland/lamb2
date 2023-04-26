import { Entity, WearableCategory } from '@dcl/schemas'
import Wallet from 'ethereumjs-wallet'
import { extractWearableDefinitionFromEntity } from '../../src/adapters/definitions'
import { ItemFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { RARITIES } from '../../src/logic/utils'
import { ContentComponent } from '../../src/ports/content'
import { ItemResponse } from '../../src/types'
import { test, testWithComponents } from '../components'
import {
  generateThirdPartyWearables,
  generateWearableContentDefinitions,
  generateWearables,
  getThirdPartyProviders
} from '../data/wearables'

import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
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

    const definitions = generateWearableContentDefinitions(
      BASE_WEARABLES.concat(onChainWearables.map((wearable) => wearable.urn)).concat(
        thirdPartyWearables.map((wearable) => wearable.urn.decentraland)
      )
    )
    console.log(definitions.length)

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: onChainWearables.slice(0, 5) })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: onChainWearables.slice(5, 10) })
    fetch.fetch = jest.fn().mockImplementation((url) => {
      console.log('Pidiendo third party', url)
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(onChainWearables)].sort(rarest),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })
})

type ContentInfo = {
  definitions: Entity[]
  content: ContentComponent
}

function convertToDataModel(wearables: ItemFromQuery[], contentInfo?: ContentInfo): ItemResponse[] {
  return wearables.map((wearable): ItemResponse => {
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
