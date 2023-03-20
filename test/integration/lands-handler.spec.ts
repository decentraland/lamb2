import { test } from '../components'
import { generateWearables } from '../data/wearables'
import Wallet from 'ethereumjs-wallet'
import { generateLANDs } from '../data/lands'
import { LANDFromQuery } from '../../src/logic/fetch-nfts'
import { LAND } from '../../src/types'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
test('lands-handler: GET /users/:address/lands should', function ({ components }) {
  it('return empty when no lands are found', async () => {
    const { localFetch, theGraph } = components

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return a LAND', async () => {
    const { localFetch, theGraph } = components

    const lands = generateLANDs(1)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: lands })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response).toEqual({
      elements: convertToDataModel(lands),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return 2 lands and paginate them correctly (page 1, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const lands = generateWearables(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: lands })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([lands[0], lands[1]]),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 2 lands and paginate them correctly (page 2, size 2, total 5)', async () => {
    const { localFetch, theGraph } = components
    const lands = generateWearables(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: lands })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([lands[2], lands[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 1 LAND and paginate them correctly (page 3, size 2, total 4)', async () => {
    const { localFetch, theGraph } = components
    const lands = generateWearables(5)

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: lands })

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands?pageSize=2&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([lands[4]]),
      pageNum: 3,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return lands from cache on second call for the same address', async () => {
    const { localFetch, theGraph } = components
    const lands = generateLANDs(7)
    const wallet = Wallet.generate().getAddressString()

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: lands })

    const r = await localFetch.fetch(`/users/${wallet}/lands?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: convertToDataModel(lands),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/lands?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
    expect(theGraph.ensSubgraph.query).toHaveBeenCalledTimes(1)
  })

  it('return an error when lands cannot be fetched', async () => {
    const { localFetch, theGraph } = components

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/lands`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'Cannot fetch lands right now'
    })
  })
})

function convertToDataModel(lands: LANDFromQuery[]): LAND[] {
  return lands.map(LAND => {
    const { name, contractAddress, tokenId, category, parcel, estate, image, activeOrder } = LAND

    const isParcel = category === 'parcel'
    const x = isParcel ? parcel?.x : undefined
    const y = isParcel ? parcel?.x : undefined
    const description = isParcel ? parcel?.data?.description : estate?.data?.description
    return {
      name: name === null ? undefined : name,
      contractAddress,
      tokenId,
      category,
      x,
      y,
      description,
      price: activeOrder ? activeOrder.price : undefined,
      image
    }
  })
}
