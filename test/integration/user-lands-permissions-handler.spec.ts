import { OperatorFromQuery } from '../../src/logic/fetch-elements/fetch-permissions'
import { LandPermission } from '../../src/types'
import { test } from '../components'
import { generatePermissions } from '../data/operators'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache
test('user-permissions-handler: GET /users/:address/lands-permissions should', function ({ components }) {
  let randomAddress: string

  beforeEach(() => {
    randomAddress = generateRandomAddress()
  })

  describe('when no permissions are found', () => {
    beforeEach(() => {
      components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce({ parcels: [] })
    })

    it('should return 200 and empty array', async () => {
      const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions`)

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: [],
        pageNum: 1,
        totalAmount: 0,
        pageSize: 100
      })
    })
  })

  describe('when there are permissions to fetch', () => {
    let permissions: OperatorFromQuery[] = []

    beforeEach(() => {
      permissions = generatePermissions(1)
      components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce({ parcels: permissions })
    })

    it('should return 200 ok and return the single operator available', async () => {
      const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions`)

      expect(r.status).toBe(200)
      const response = await r.json()
      expect(response).toEqual({
        elements: convertToDataModel(permissions),
        pageNum: 1,
        pageSize: 100,
        totalAmount: 1
      })
    })

    describe('and there are more than one operator', () => {
      beforeEach(() => {
        permissions = generatePermissions(5)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce({ parcels: permissions })
      })

      it('should return 2 operators and paginate them correctly (page 1, size 2, total 5)', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions?pageSize=2&pageNum=1`)

        expect(r.status).toBe(200)
        expect(await r.json()).toEqual({
          elements: convertToDataModel([permissions[0], permissions[1]]),
          pageNum: 1,
          pageSize: 2,
          totalAmount: 5
        })
      })

      it('should return 2 operators and paginate them correctly (page 2, size 2, total 5)', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions?pageSize=2&pageNum=2`)

        expect(r.status).toBe(200)
        expect(await r.json()).toEqual({
          elements: convertToDataModel([permissions[2], permissions[3]]),
          pageNum: 2,
          pageSize: 2,
          totalAmount: 5
        })
      })

      it('should return 1 operator and paginate them correctly (page 3, size 2, total 5)', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions?pageSize=2&pageNum=3`)

        expect(r.status).toBe(200)
        expect(await r.json()).toEqual({
          elements: convertToDataModel([permissions[4]]),
          pageNum: 3,
          pageSize: 2,
          totalAmount: 5
        })
      })

      it('should return multiples operators from cache on second call for the same address', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions?pageSize=5&pageNum=1`)
        const rBody = await r.json()

        expect(r.status).toBe(200)
        expect(rBody).toEqual({
          elements: convertToDataModel(permissions),
          pageNum: 1,
          pageSize: 5,
          totalAmount: 5
        })

        const r2 = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions?pageSize=5&pageNum=1`)
        expect(r2.status).toBe(r.status)
        expect(await r2.json()).toEqual(rBody)
        expect(components.theGraph.landSubgraph.query).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when there is an error fetching operators', () => {
    beforeEach(() => {
      components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)
    })

    it('should return 502 and error message when operators cannot be fetched', async () => {
      const r = await components.localFetch.fetch(`/users/${randomAddress}/lands-permissions`)
      const data = await r.json()
      expect(r.status).toBe(502)
      expect(data.error).toEqual('The requested items cannot be fetched right now')
    })
  })
})

function convertToDataModel(permissions: OperatorFromQuery[]): LandPermission[] {
  return permissions.map((permission) => {
    const { id, x, y, owner, updateOperator } = permission
    return {
      id,
      x,
      y,
      owner: owner.id,
      updateOperator
    }
  })
}
