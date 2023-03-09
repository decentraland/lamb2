import { test } from '../components'
import { generateWearables } from '../data/wearables'
import Wallet  from 'ethereumjs-wallet'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
test('wearables-handler: GET /users/:address/wearables should', function ({ components }) {
  it('return empty when no wearables are found', async () => {
    const { localFetch, theGraph } = components

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables`)

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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?includeDefinitions`)

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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables),
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables),
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(wearables),
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[0], wearables[1]]),
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

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[2], wearables[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (3 eth and 1 matic) and paginate them correctly (page 1, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[3]] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[0], wearables[1]]),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (3 eth and 1 matic) and paginate them correctly (page 2, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(4)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[3]] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[2], wearables[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 4
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 1, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=3&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[0], wearables[1], wearables[2]]),
      pageNum: 1,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 2, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=3&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[3], wearables[4], wearables[5]]),
      pageNum: 2,
      pageSize: 3,
      totalAmount: 7
    })
  })

  it('return wearables (4 eth and 3 matic) and paginate them correctly (page 3, size 3, total 7)', async () => {
    const { localFetch, theGraph } = components
    const wearables = generateWearables(7)

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[0], wearables[1], wearables[2], wearables[3]] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [wearables[4], wearables[5], wearables[6]] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/wearables?pageSize=3&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([ wearables[6]]),
      pageNum: 3,
      pageSize: 3,
      totalAmount: 7
    })
  })
})

function convertToDataModel(wearables) {
    return wearables.map(wearable => ({
        urn: wearable.urn,
        amount: 1,
        individualData: [{
            id: wearable.id,
            tokenId: wearable.tokenId,
            transferredAt: wearable.transferredAt,
            price: wearable.item.price
        }],
        rarity: wearable.item.rarity
    }))
}
