import { NameFromQuery } from '../../src/logic/fetch-elements/fetch-names'
import { Name } from '../../src/types'
import { test } from '../components'
import { generateNames } from '../data/names'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache
test('names-handler: GET /users/:address/names should', function ({ components }) {
  it('return empty when no names are found', async () => {
    const { localFetch, theGraph } = components

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return a name', async () => {
    const { localFetch, theGraph } = components

    const names = generateNames(1)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: names })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response).toEqual({
      elements: convertToDataModel(names),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return 2 names and paginate them correctly (page 1, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const names = generateNames(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: names })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([names[0], names[1]]),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 2 names and paginate them correctly (page 2, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const names = generateNames(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: names })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([names[2], names[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 1 name and paginate them correctly (page 3, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const names = generateNames(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: names })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([names[4]]),
      pageNum: 3,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return names from cache on second call for the same address', async () => {
    const { localFetch, theGraph } = components
    const names = generateNames(7)
    const wallet = generateRandomAddress()

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: names })

    const r = await localFetch.fetch(`/users/${wallet}/names?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: convertToDataModel(names),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/names?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
    expect(theGraph.ensSubgraph.query).toHaveBeenCalledTimes(1)
  })

  it('return an error when names cannot be fetched', async () => {
    const { localFetch, theGraph } = components

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)
    const data = await r.json()
    expect(r.status).toBe(502)
    expect(data.error).toEqual('The requested items cannot be fetched right now')
  })
})

function convertToDataModel(names: NameFromQuery[]): Name[] {
  return names.map((name) => {
    return {
      name: name.name,
      tokenId: name.tokenId,
      contractAddress: name.contractAddress,
      price: name.activeOrder?.price
    }
  })
}
