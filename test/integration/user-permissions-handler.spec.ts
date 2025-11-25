import { test } from '../components'
import {
  createEmptyGraphResult,
  createOwnerGraphResult,
  createUpdateOperatorGraphResult,
  createOperatorGraphResult,
  createMixedPermissionsGraphResult
} from '../data/users-permissions'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache
test('user-permissions-handler: GET /users/:address/permissions should', function ({ components }) {
  let randomAddress: string

  beforeEach(() => {
    randomAddress = generateRandomAddress()
  })

  describe('when no permissions are found', () => {
    beforeEach(() => {
      components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(createEmptyGraphResult())
    })

    it('should respond with 200 and empty array', async () => {
      const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

      expect(r.status).toBe(200)
      const response = await r.json()
      expect(response.elements).toEqual([])
    })

    it('should return correct pagination metadata for empty results', async () => {
      const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

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
    describe('and the user is a direct parcel owner', () => {
      let graphResult: any

      beforeEach(() => {
        graphResult = createOwnerGraphResult(randomAddress, 1)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should return 200 and include owner permission type', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements).toHaveLength(1)
        expect(response.elements[0].permissions).toEqual(['owner'])
      })

      it('should include owner information', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements[0].owner).toBe(randomAddress.toLowerCase())
      })
    })

    describe('and the user has updateOperator permission on parcels', () => {
      let graphResult: any
      let ownerAddress: string

      beforeEach(() => {
        ownerAddress = generateRandomAddress()
        graphResult = createUpdateOperatorGraphResult(randomAddress, ownerAddress, 1)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should return 200 and include updateOperator permission type', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements).toHaveLength(1)
        expect(response.elements[0].permissions).toEqual(['updateOperator'])
      })

      it('should include owner information', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements[0].owner).toBe(ownerAddress.toLowerCase())
      })
    })

    describe('and the user has operator permission', () => {
      let graphResult: any
      let ownerAddress: string

      beforeEach(() => {
        ownerAddress = generateRandomAddress()
        graphResult = createOperatorGraphResult(randomAddress, ownerAddress, 1)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should return 200 and include operator permission type', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements).toHaveLength(1)
        expect(response.elements[0].permissions).toEqual(['operator'])
      })

      it('should include owner information', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements[0].owner).toBe(ownerAddress.toLowerCase())
      })
    })

    describe('and the user has multiple permission types on the same parcel', () => {
      describe('and the user is owner with updateOperator permission', () => {
        let graphResult: any
        let ownerAddress: string

        beforeEach(() => {
          ownerAddress = generateRandomAddress()
          graphResult = createMixedPermissionsGraphResult(randomAddress, ownerAddress, {
            includeOwner: true,
            includeUpdateOperator: true
          })
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should merge permission types into a single parcel entry', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements).toHaveLength(1)
        })

        it('should include all permission types in the permissions array', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements[0].permissions).toEqual(['owner', 'updateOperator'])
        })
      })

      describe('and the user is owner with operator permission', () => {
        let graphResult: any
        let ownerAddress: string

        beforeEach(() => {
          ownerAddress = generateRandomAddress()
          graphResult = createMixedPermissionsGraphResult(randomAddress, ownerAddress, {
            includeOwner: true,
            includeOperator: true
          })
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should include both permission types', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements[0].permissions).toEqual(['operator', 'owner'])
        })
      })

      describe('and the user has updateOperator and operator permissions', () => {
        let graphResult: any
        let ownerAddress: string

        beforeEach(() => {
          ownerAddress = generateRandomAddress()
          graphResult = createMixedPermissionsGraphResult(randomAddress, ownerAddress, {
            includeUpdateOperator: true,
            includeOperator: true
          })
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should include both permission types', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements[0].permissions).toEqual(['operator', 'updateOperator'])
        })
      })

      describe('and the user has all three permission types', () => {
        let graphResult: any
        let ownerAddress: string

        beforeEach(() => {
          ownerAddress = generateRandomAddress()
          graphResult = createMixedPermissionsGraphResult(randomAddress, ownerAddress, {
            includeOwner: true,
            includeUpdateOperator: true,
            includeOperator: true
          })
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should include all three permission types', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements[0].permissions).toEqual(['operator', 'owner', 'updateOperator'])
        })
      })
    })

    describe('and there are multiple parcels with permissions', () => {
      let graphResult: any

      beforeEach(() => {
        graphResult = createOwnerGraphResult(randomAddress, 5)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should return all parcels with their respective permissions', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements).toHaveLength(5)
        expect(response.totalAmount).toBe(5)
      })

      describe('and pagination is requested', () => {
        beforeEach(() => {
          graphResult = createOwnerGraphResult(randomAddress, 5)
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should return first page with correct pageSize and totalAmount (page 1, size 2, total 5)', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=2&pageNum=1`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements).toHaveLength(2)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(2)
          expect(response.totalAmount).toBe(5)
        })

        it('should return second page with correct pagination metadata (page 2, size 2, total 5)', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=2&pageNum=2`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements).toHaveLength(2)
          expect(response.pageNum).toBe(2)
          expect(response.pageSize).toBe(2)
          expect(response.totalAmount).toBe(5)
        })

        it('should return last page with remaining items (page 3, size 2, total 5)', async () => {
          const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=2&pageNum=3`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.elements).toHaveLength(1)
          expect(response.pageNum).toBe(3)
          expect(response.pageSize).toBe(2)
          expect(response.totalAmount).toBe(5)
        })
      })

      describe('and the same address is queried multiple times', () => {
        beforeEach(() => {
          graphResult = createOwnerGraphResult(randomAddress, 5)
          components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
        })

        it('should return cached results on second call', async () => {
          const r1 = await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=5&pageNum=1`)
          const r1Body = await r1.json()

          expect(r1.status).toBe(200)
          expect(r1Body.elements).toHaveLength(5)

          const r2 = await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=5&pageNum=1`)
          const r2Body = await r2.json()

          expect(r2.status).toBe(200)
          expect(r2Body).toEqual(r1Body)
        })

        it('should only query the graph once when cache is hit', async () => {
          await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=5&pageNum=1`)
          await components.localFetch.fetch(`/users/${randomAddress}/permissions?pageSize=5&pageNum=1`)

          expect(components.theGraph.landSubgraph.query).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  describe('when there is an error fetching permissions', () => {
    describe('and the graph query returns undefined', () => {
      beforeEach(() => {
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(undefined)
      })

      it('should respond with 502 and error message', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)
        const data = await r.json()
        expect(r.status).toBe(502)
        expect(data.error).toBeDefined()
      })
    })

    describe('and the graph query throws an error', () => {
      beforeEach(() => {
        components.theGraph.landSubgraph.query = jest.fn().mockRejectedValueOnce(new Error('Graph query failed'))
      })

      it('should respond with 502 and propagate the error message', async () => {
        const r = await components.localFetch.fetch(`/users/${randomAddress}/permissions`)
        const data = await r.json()
        expect(r.status).toBe(502)
        expect(data.error).toBeDefined()
      })
    })
  })

  describe('when the address has mixed case', () => {
    describe('and the endpoint is called', () => {
      let mixedCaseAddress: string
      let graphResult: any

      beforeEach(() => {
        mixedCaseAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12'
        graphResult = createOwnerGraphResult(mixedCaseAddress.toLowerCase(), 1)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should normalize address to lowercase and return results', async () => {
        const r = await components.localFetch.fetch(`/users/${mixedCaseAddress}/permissions`)

        expect(r.status).toBe(200)
        const response = await r.json()
        expect(response.elements).toHaveLength(1)
      })
    })

    describe('and the graph query is called', () => {
      let mixedCaseAddress: string
      let graphResult: any

      beforeEach(() => {
        mixedCaseAddress = '0xCcDdEe9876543210CcDdEe9876543210CcDdEe98'
        graphResult = createOwnerGraphResult(mixedCaseAddress.toLowerCase(), 1)
        components.theGraph.landSubgraph.query = jest.fn().mockResolvedValueOnce(graphResult)
      })

      it('should call the graph with lowercase address', async () => {
        await components.localFetch.fetch(`/users/${mixedCaseAddress}/permissions`)

        expect(components.theGraph.landSubgraph.query).toHaveBeenCalledWith(expect.any(String), {
          address: mixedCaseAddress.toLowerCase(),
          addressBytes: mixedCaseAddress.toLowerCase()
        })
      })
    })
  })
})
