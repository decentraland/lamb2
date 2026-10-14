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
      jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce({
        elements: [mockResult],
        totalAmount: 1
      })
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
      jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce({
        elements: [mockResult],
        totalAmount: 1
      })
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

  describe('when the name has an uppercase .dcl.eth suffix and surrounding whitespace', () => {
    let ownerAddress: string
    let fetchSpy: jest.SpyInstance
    let response: Response

    beforeEach(async () => {
      ownerAddress = generateRandomAddress()
      fetchSpy = jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce({
        elements: [{ owner: ownerAddress }],
        totalAmount: 1
      })
      response = await components.localFetch.fetch(`/names/${encodeURIComponent(' Test-Name.DCL.ETH ')}/owner`)
    })

    it('should look up the trimmed, lowercased name without the suffix', () => {
      expect(fetchSpy).toHaveBeenCalledWith('test-name')
    })

    it('should return 200 status with owner information', async () => {
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ owner: ownerAddress })
    })
  })

  describe('when the name is empty after removing the .dcl.eth suffix', () => {
    let fetchSpy: jest.SpyInstance
    let response: Response

    beforeEach(async () => {
      fetchSpy = jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements')
      response = await components.localFetch.fetch(`/names/${encodeURIComponent(' .DCL.eth')}/owner`)
    })

    it('should not look up the name', () => {
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return 404 status with an empty body', async () => {
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('')
    })
  })

  describe('when the name does not exist', () => {
    let testName: string

    beforeEach(() => {
      testName = 'non-existent-name'
    })

    describe('and no results are found', () => {
      beforeEach(() => {
        jest.spyOn(nameOwnerFetcher, 'fetchOwnedElements').mockResolvedValueOnce({
          elements: [],
          totalAmount: 0
        })
      })

      it('should return 404 status', async () => {
        const { localFetch } = components

        const r = await localFetch.fetch(`/names/${testName}/owner`)

        expect(r.status).toBe(404)
      })
    })
  })
})
