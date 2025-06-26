import { Name } from '../../src/types'
import { test } from '../components'
import { generateRandomAddress } from '../helpers'
import { createMockProfileName } from '../mocks/dapps-db-mock'
import { FetcherError } from '../../src/adapters/elements-fetcher'

// NOTE: each test generates a new wallet to avoid matches on cache
test('names-handler: GET /users/:address/names should', function ({ components }) {
  it('return empty when no names are found', async () => {
    const { localFetch, dappsDb } = components

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue([])

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
    const { localFetch, dappsDb } = components

    const mockName = createMockProfileName({
      name: 'testname',
      tokenId: '123',
      contractAddress: '0x123',
      price: 100
    })

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue([mockName])

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)

    expect(r.status).toBe(200)
    const response = await r.json()
    expect(response).toEqual({
      elements: [
        {
          name: 'testname',
          tokenId: '123',
          contractAddress: '0x123',
          price: 100
        }
      ],
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return 2 names and paginate them correctly (page 1, size 2, total 5)', async () => {
    const { localFetch, dappsDb } = components

    const mockNames = [
      createMockProfileName({ name: 'name1', tokenId: '1', contractAddress: '0x1', price: 100 }),
      createMockProfileName({ name: 'name2', tokenId: '2', contractAddress: '0x2', price: 200 }),
      createMockProfileName({ name: 'name3', tokenId: '3', contractAddress: '0x3', price: 300 }),
      createMockProfileName({ name: 'name4', tokenId: '4', contractAddress: '0x4', price: 400 }),
      createMockProfileName({ name: 'name5', tokenId: '5', contractAddress: '0x5', price: 500 })
    ]

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue(mockNames)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [
        { name: 'name1', tokenId: '1', contractAddress: '0x1', price: 100 },
        { name: 'name2', tokenId: '2', contractAddress: '0x2', price: 200 }
      ],
      pageNum: 1,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 2 names and paginate them correctly (page 2, size 2, total 5)', async () => {
    const { localFetch, dappsDb } = components

    const mockNames = [
      createMockProfileName({ name: 'name1', tokenId: '1', contractAddress: '0x1', price: 100 }),
      createMockProfileName({ name: 'name2', tokenId: '2', contractAddress: '0x2', price: 200 }),
      createMockProfileName({ name: 'name3', tokenId: '3', contractAddress: '0x3', price: 300 }),
      createMockProfileName({ name: 'name4', tokenId: '4', contractAddress: '0x4', price: 400 }),
      createMockProfileName({ name: 'name5', tokenId: '5', contractAddress: '0x5', price: 500 })
    ]

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue(mockNames)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [
        { name: 'name3', tokenId: '3', contractAddress: '0x3', price: 300 },
        { name: 'name4', tokenId: '4', contractAddress: '0x4', price: 400 }
      ],
      pageNum: 2,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return 1 name and paginate them correctly (page 3, size 2, total 4)', async () => {
    const { localFetch, dappsDb } = components

    const mockNames = [
      createMockProfileName({ name: 'name1', tokenId: '1', contractAddress: '0x1', price: 100 }),
      createMockProfileName({ name: 'name2', tokenId: '2', contractAddress: '0x2', price: 200 }),
      createMockProfileName({ name: 'name3', tokenId: '3', contractAddress: '0x3', price: 300 }),
      createMockProfileName({ name: 'name4', tokenId: '4', contractAddress: '0x4', price: 400 }),
      createMockProfileName({ name: 'name5', tokenId: '5', contractAddress: '0x5', price: 500 })
    ]

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue(mockNames)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names?pageSize=2&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [{ name: 'name5', tokenId: '5', contractAddress: '0x5', price: 500 }],
      pageNum: 3,
      pageSize: 2,
      totalAmount: 5
    })
  })

  it('return names consistently on multiple calls for the same address', async () => {
    const { localFetch, dappsDb } = components

    const mockNames = [
      createMockProfileName({ name: 'name1', tokenId: '1', contractAddress: '0x1', price: 100 }),
      createMockProfileName({ name: 'name2', tokenId: '2', contractAddress: '0x2', price: 200 }),
      createMockProfileName({ name: 'name3', tokenId: '3', contractAddress: '0x3', price: 300 }),
      createMockProfileName({ name: 'name4', tokenId: '4', contractAddress: '0x4', price: 400 }),
      createMockProfileName({ name: 'name5', tokenId: '5', contractAddress: '0x5', price: 500 }),
      createMockProfileName({ name: 'name6', tokenId: '6', contractAddress: '0x6', price: 600 }),
      createMockProfileName({ name: 'name7', tokenId: '7', contractAddress: '0x7', price: 700 })
    ]

    const wallet = generateRandomAddress()

    dappsDb.getNamesByOwner = jest.fn().mockResolvedValue(mockNames)

    const r = await localFetch.fetch(`/users/${wallet}/names?pageSize=7&pageNum=1`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: mockNames.map((name) => ({
        name: name.name,
        tokenId: name.tokenId,
        contractAddress: name.contractAddress,
        price: name.price
      })),
      pageNum: 1,
      pageSize: 7,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/names?pageSize=7&pageNum=1`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)
    // Note: No caching in current implementation, so getNamesByOwner may be called multiple times
  })

  it('return an error when names cannot be fetched', async () => {
    const { localFetch, dappsDb } = components

    dappsDb.getNamesByOwner = jest.fn().mockRejectedValue(new FetcherError('Database error'))

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/names`)
    const data = await r.json()
    expect(r.status).toBe(502)
    expect(data.error).toEqual('The requested items cannot be fetched right now')
  })
})
