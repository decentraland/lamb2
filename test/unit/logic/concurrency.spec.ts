import { BulkheadSaturatedError, createBulkhead, mapWithConcurrency } from '../../../src/logic/concurrency'

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

  describe('and one item fails while another is still running', () => {
    let failing: jest.Mock
    let inFlightAtRejection: number

    beforeEach(async () => {
      inFlightAtRejection = -1
      failing = jest.fn(async (item: number) => {
        inFlight++
        try {
          await new Promise((resolve) => setTimeout(resolve, item === 2 ? 5 : 30))
          if (item === 2) {
            throw new Error('boom')
          }
          return item
        } finally {
          inFlight--
        }
      })
      await mapWithConcurrency([1, 2, 3, 4], 2, failing).catch(() => {
        inFlightAtRejection = inFlight
      })
    })

    it('should reject with that failure', async () => {
      await expect(mapWithConcurrency([1, 2, 3, 4], 2, failing)).rejects.toThrow('boom')
    })

    it('should not start the items after the failure', () => {
      expect(failing).toHaveBeenCalledTimes(2)
    })

    it('should only reject once every call it had started has settled', () => {
      expect(inFlightAtRejection).toBe(0)
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

describe('when running calls through a bulkhead', () => {
  let inFlight: number
  let maxInFlight: number

  beforeEach(() => {
    inFlight = 0
    maxInFlight = 0
  })

  describe('and more callers arrive than the limit allows', () => {
    let results: number[]

    beforeEach(async () => {
      const bulkhead = createBulkhead(3, 10)
      results = await Promise.all(
        Array.from({ length: 10 }, (_, index) =>
          bulkhead.run(async () => {
            inFlight++
            maxInFlight = Math.max(maxInFlight, inFlight)
            await new Promise((resolve) => setTimeout(resolve, 5))
            inFlight--
            return index
          })
        )
      )
    })

    it('should never run more than the limit at once, whoever the callers are', () => {
      expect(maxInFlight).toBe(3)
    })

    it('should still complete every call', () => {
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('and the queue is full as well', () => {
    let outcomes: PromiseSettledResult<string>[]
    let releaseFirst: () => void

    beforeEach(async () => {
      const bulkhead = createBulkhead(1, 1)
      // The gate exists before the first call starts, so it can be opened whenever.
      const gate = new Promise<string>((resolve) => (releaseFirst = () => resolve('first')))
      const first = bulkhead.run(() => gate)
      const second = bulkhead.run(async () => 'second')
      const third = bulkhead.run(async () => 'third')
      releaseFirst()
      outcomes = await Promise.allSettled([first, second, third])
    })

    it('should run the call that fit and the one that queued', () => {
      expect(outcomes.slice(0, 2).map((outcome) => outcome.status)).toEqual(['fulfilled', 'fulfilled'])
    })

    it('should fail the call that found no room immediately', () => {
      expect(outcomes[2].status === 'rejected' && outcomes[2].reason instanceof BulkheadSaturatedError).toBe(true)
    })
  })
})
