import { mapWithConcurrency } from '../../../src/logic/concurrency'

describe('when mapping items with bounded concurrency', () => {
  let fn: jest.Mock
  let inFlight: number
  let maxInFlight: number

  beforeEach(() => {
    inFlight = 0
    maxInFlight = 0
    fn = jest.fn(async (item: number) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight--
      return item * 2
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and there are more items than the limit', () => {
    let result: number[]

    beforeEach(async () => {
      result = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, fn)
    })

    it('should return the results in item order', () => {
      expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    })

    it('should never run more than the limit at once', () => {
      expect(maxInFlight).toBe(3)
    })
  })

  describe('and one item fails', () => {
    let failing: jest.Mock

    beforeEach(() => {
      failing = jest.fn(async (item: number) => {
        if (item === 2) {
          throw new Error('boom')
        }
        return item
      })
    })

    it('should reject with that failure', async () => {
      await expect(mapWithConcurrency([1, 2, 3, 4], 1, failing)).rejects.toThrow('boom')
    })

    it('should not start the items after the failure', async () => {
      await mapWithConcurrency([1, 2, 3, 4], 1, failing).catch(() => undefined)
      expect(failing).toHaveBeenCalledTimes(2)
    })
  })

  describe('and there are no items', () => {
    let result: number[]

    beforeEach(async () => {
      result = await mapWithConcurrency([], 4, fn)
    })

    it('should resolve to an empty list without calling the mapper', () => {
      expect(fn).not.toHaveBeenCalled()
    })

    it('should resolve to an empty list', () => {
      expect(result).toEqual([])
    })
  })
})
