import { test } from '../components'
import { generateEmoteContentDefinitions, generateEmotes } from '../data/emotes'
import Wallet from 'ethereumjs-wallet'
import { Item } from '../../src/types'
import { ItemFromQuery } from '../../src/logic/fetch-elements/fetch-items'

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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes, definitions),
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes, definitions),
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

  it('return an error when emotes cannot be fetched from ethereum collection', async () => {
    const { localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'Cannot fetch emotes right now'
    })
  })

  it('return an error when emotes cannot be fetched from matic collection', async () => {
    const { localFetch, theGraph } = components

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)

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
    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(undefined)

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/emotes?includeDefinitions`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })
})

function convertToDataModel(emotes: ItemFromQuery[], definitions = undefined): Item[] {
  return emotes.map(emote => {
    const individualData = {
      id: emote.id,
      tokenId: emote.tokenId,
      transferredAt: emote.transferredAt,
      price: emote.item.price
    }
    const rarity = emote.item.rarity
    const definition = definitions?.find(def => def.id === emote.urn)
    const definitionData = definition?.metadata?.emoteDataADR74

    return {
      urn: emote.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      ...(definitions ? {
        definition: definitionData && {
          id: emote.urn,
          emoteDataADR74: {
            ...definitionData,
            representations: [{ contents: [{ key: definitionData.representations[0]?.contents[0] }] }]
          }
        }
      } : {})
    }
  })
}

