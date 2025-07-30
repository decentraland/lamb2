import { NameOwner } from '../../src/types'
import { test } from '../components'
import { generateRandomAddress } from '../helpers'

test('Integration tests for name-owner-handle', function ({ components }) {
  let nameOwnerFetcher: any

  beforeEach(() => {
    nameOwnerFetcher = components.nameOwnerFetcher
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when the name has the .dcl.eth suffix', () => {
    let testName: string
    let ownerAddress: string
    let mockResult: any

    beforeEach(() => {
      testName = 'test-name.dcl.eth'
      ownerAddress = generateRandomAddress()
      mockResult = {
        owner: ownerAddress
      }
      jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce([mockResult])
    })

    it('should return 200 status with owner information', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/names/${testName}/owner`)

      expect(r.status).toBe(200)
      const response = await r.json()
      expect(response).toEqual({
        owner: ownerAddress
      })
    })
  })

  describe('when the name does not have the .dcl.eth suffix', () => {
    let testName: string
    let ownerAddress: string
    let mockResult: any

    beforeEach(() => {
      testName = 'test-name'
      ownerAddress = generateRandomAddress()
      mockResult = {
        owner: ownerAddress
      }
      jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce([mockResult])
    })

    it('should return 200 status with owner information', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/names/${testName}/owner`)

      expect(r.status).toBe(200)
      const response = await r.json()
      expect(response).toEqual({
        owner: ownerAddress
      })
    })
  })

  describe('when the name does not exist', () => {
    let testName: string

    beforeEach(() => {
      testName = 'non-existent-name'
    })

    describe('and no results are found', () => {
      beforeEach(() => {
        jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce([])
      })

      it('should return 404 status', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/names/${testName}/owner`)

        expect(r.status).toBe(404)
      })
    })
  })
})
