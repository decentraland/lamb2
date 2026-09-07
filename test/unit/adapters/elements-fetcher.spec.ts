import { createElementsFetcherComponent, ElementsFetcher, FetcherError } from '../../../src/adapters/elements-fetcher'

const logs = {
  getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() })
}

function settled(elements: string[]) {
  return { elements, totalAmount: elements.length }
}

describe('when fetching owned elements', () => {
  let fetchElements: jest.Mock
  let fetcher: ElementsFetcher<string>

  beforeEach(() => {
    fetchElements = jest.fn()
    fetcher = createElementsFetcherComponent<string>({ logs } as any, fetchElements)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and a second request for the same address arrives while the first is in flight', () => {
    let results: Awaited<ReturnType<ElementsFetcher<string>['fetchOwnedElements']>>[]

    beforeEach(async () => {
      fetchElements.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return settled(['a'])
      })
      results = await Promise.all([fetcher.fetchOwnedElements('0xAbC'), fetcher.fetchOwnedElements('0xabc')])
    })

    it('should fetch upstream once and hand both requests the result', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })

    it('should answer both requests with the same elements', () => {
      expect(results[1]).toEqual(results[0])
    })
  })

  describe('and the requests are for different addresses', () => {
    beforeEach(async () => {
      fetchElements.mockResolvedValue(settled([]))
      await Promise.all([fetcher.fetchOwnedElements('0x1'), fetcher.fetchOwnedElements('0x2')])
    })

    it('should fetch upstream once per address', () => {
      expect(fetchElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and the upstream fails while requests are waiting on it', () => {
    let outcomes: PromiseSettledResult<unknown>[]

    beforeEach(async () => {
      fetchElements.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        throw new Error('upstream down')
      })
      outcomes = await Promise.allSettled([fetcher.fetchOwnedElements('0x1'), fetcher.fetchOwnedElements('0x1')])
    })

    it('should fail both requests from the single upstream attempt', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })

    it('should report the failure as a fetcher error to every waiter', () => {
      expect(
        outcomes.map((outcome) => outcome.status === 'rejected' && outcome.reason instanceof FetcherError)
      ).toEqual([true, true])
    })

    it('should try upstream again on the next request instead of remembering the failure', async () => {
      fetchElements.mockResolvedValueOnce(settled(['b']))
      await fetcher.fetchOwnedElements('0x1')
      expect(fetchElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and the address was fetched a moment ago', () => {
    beforeEach(async () => {
      fetchElements.mockResolvedValue(settled(['a']))
      await fetcher.fetchOwnedElements('0x1')
      await fetcher.fetchOwnedElements('0x1')
    })

    it('should serve the repeat from the cache', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })
  })

  describe('and two requests differ only in the case of a filter value', () => {
    beforeEach(async () => {
      fetchElements.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return settled(['a'])
      })
      await Promise.all([
        fetcher.fetchOwnedElements('0x1', undefined, { name: 'Foo' }),
        fetcher.fetchOwnedElements('0x1', undefined, { name: 'foo' })
      ])
    })

    it('should treat them as the same request, since filters match case-insensitively downstream', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })
  })
})
