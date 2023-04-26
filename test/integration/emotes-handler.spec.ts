import { EmoteCategory, Entity } from '@dcl/schemas'
import Wallet from 'ethereumjs-wallet'
import { extractEmoteDefinitionFromEntity } from '../../src/adapters/definitions'
import { EmoteFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
import { RARITIES } from '../../src/logic/utils'
import { ContentComponent } from '../../src/ports/content'
import { ItemResponse } from '../../src/types'
import { test } from '../components'
import { generateEmoteContentDefinitions, generateEmotes } from '../data/emotes'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
test('emotes-handler: GET /users/:address/emotes should', function ({ components }) {
  it('return empty when no emotes are found', async () => {
    const { localFetch, theGraph } = components

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return empty when no emotes are found with includeDefinitions set', async () => {
    const { localFetch, theGraph, content } = components

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce([])

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return a emote from matic collection', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(1)

    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return emotes with includeDefinitions set', async () => {
    const { localFetch, theGraph, content } = components
    const emotes = generateEmotes(1)
    const definitions = generateEmoteContentDefinitions(emotes.map((emote) => emote.urn))

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes, { definitions, content }),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return a emote with definition and another one without definition', async () => {
    const { localFetch, theGraph, content } = components
    const emotes = generateEmotes(2)
    const definitions = generateEmoteContentDefinitions([emotes[0].urn])

    // modify emote urn to avoid cache hit
    emotes[1] = { ...emotes[1], urn: 'anotherUrn' }
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)
    content.getExternalContentServerUrl = jest.fn().mockReturnValue('contentUrl')

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[1], emotes[0]], { definitions, content }),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return emotes 2 and paginate them correctly (page 1, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(5)

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[0], emotes[1]]),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return emotes 2 and paginate them correctly (page 2, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(5)

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[2], emotes[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return emotes 2 and paginate them correctly (page 3, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(5)

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?pageSize=2&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[4]]),
      pageNum: 3,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return emotes from cache on second call for the same address (case insensitive)', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(7)
    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: convertToDataModel(emotes),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/emotes?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
    expect(theGraph.maticCollectionsSubgraph.query).toHaveBeenCalledTimes(1)
  })

  it('return emotes filtering by name', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17)
    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&name=4`)

    const rBody = await r.json()
    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: [convertToDataModel(emotes)[14], convertToDataModel(emotes)[4]],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 2
    })
  })

  it('return emotes filtering by category', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17).map((w, i) => ({
      ...w,
      metadata: {
        emote: {
          name: 'name-' + i,
          category: i % 2 === 0 ? EmoteCategory.FUN : EmoteCategory.DANCE
        }
      }
    }))

    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&category=${EmoteCategory.FUN}`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes).filter((w, i) => i % 2 === 0)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 9
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&category=${EmoteCategory.DANCE}`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes).filter((w, i) => i % 2 === 1)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 8
    })

    const r3 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&category=${EmoteCategory.HORROR}`)
    expect(r3.status).toBe(200)
    expect(await r3.json()).toEqual({
      elements: [],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 0
    })

    const r4 = await localFetch.fetch(
      `/users/${wallet}/emotes?pageSize=20&pageNum=1&category=${EmoteCategory.FUN}&category=${EmoteCategory.DANCE}`
    )
    expect(r4.status).toBe(200)
    expect(await r4.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return emotes filtering by rarity', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: i % 2 === 0 ? 'rare' : 'mythic'
      }
    }))

    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&rarity=rare`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes).filter((w, i) => i % 2 === 0)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 9
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&rarity=mythic`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes).filter((w, i) => i % 2 === 1)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 8
    })

    const r3 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&rarity=unique`)
    expect(r3.status).toBe(200)
    expect(await r3.json()).toEqual({
      elements: [],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 0
    })
  })

  it('return emotes sorted by newest / oldest', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17).map((w, i) => ({
      ...w,
      transferredAt: w.transferredAt + i
    }))

    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=newest`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes)].reverse(),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=oldest`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes)],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return emotes sorted by rarest / least_rare', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17).map((w, i) => ({
      ...w,
      item: {
        ...w.item,
        rarity: RARITIES[i % RARITIES.length]
      }
    }))

    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=rarest`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(rarest),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=least_rare`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(leastRare),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return emotes sorted by name_a_z / name_z_a', async () => {
    const { localFetch, theGraph } = components
    const emotes = generateEmotes(17)

    const wallet = Wallet.generate().getAddressString()

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=name_a_z`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(nameAZ),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&sort=name_z_a`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(nameZA),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return an error when emotes cannot be fetched from matic collection', async () => {
    const { localFetch, theGraph } = components

    theGraph.maticCollectionsSubgraph.query = jest
      .fn()
      .mockRejectedValueOnce(new Error(`GraphQL Error: Invalid response. Errors:\n- some error. Provider: matic`))

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'Cannot fetch emotes right now'
    })
  })

  it('return a generic error when an unexpected error occurs (definitions cannot be fetched)', async () => {
    const { localFetch, theGraph, content } = components
    const emotes = generateEmotes(2)

    // modify emote urn to avoid cache hit
    emotes[1] = { ...emotes[1], urn: 'anotherUrn' }

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: emotes })
    content.fetchEntitiesByPointers = jest.fn().mockRejectedValueOnce(new Error(`Cannot fetch definitions`))

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })
})

type ContentInfo = {
  definitions: Entity[]
  content: ContentComponent
}

function convertToDataModel(emotes: EmoteFromQuery[], contentInfo?: ContentInfo): ItemResponse[] {
  return emotes.map((emote): ItemResponse => {
    const individualData = {
      id: emote.id,
      tokenId: emote.tokenId,
      transferredAt: emote.transferredAt,
      price: emote.item.price
    }
    const rarity = emote.item.rarity
    const definition = contentInfo?.definitions.find((def) => def.id === emote.urn)
    const content = contentInfo?.content
    return {
      urn: emote.urn,
      amount: 1,
      individualData: [individualData],
      category: emote.metadata.emote.category,
      name: emote.metadata.emote.name,
      rarity,
      definition: definition ? extractEmoteDefinitionFromEntity({ content }, definition) : undefined
    }
  })
}
