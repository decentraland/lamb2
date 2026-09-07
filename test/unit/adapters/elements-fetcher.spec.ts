import {
  createElementsFetcherComponent,
  ElementsFetcher,
  FetcherError,
  readElementsCacheSettings
} from '../../../src/adapters/elements-fetcher'

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

  describe('and the entry has gone stale', () => {
    let stale: ElementsFetcher<string>
    let served: string[][]

    beforeEach(async () => {
      let call = 0
      fetchElements.mockImplementation(async () => settled([`v${++call}`]))
      stale = createElementsFetcherComponent<string>({ logs } as any, fetchElements, {
        maxEntries: 10,
        maxAge: 20,
        serveStale: true
      })
      served = []
      served.push((await stale.fetchOwnedElements('0x1')).elements)
      await new Promise((resolve) => setTimeout(resolve, 40))
      served.push((await stale.fetchOwnedElements('0x1')).elements)
      await new Promise((resolve) => setTimeout(resolve, 10))
      served.push((await stale.fetchOwnedElements('0x1')).elements)
    })

    it('should answer the stale request at once with the previous value', () => {
      expect(served[1]).toEqual(['v1'])
    })

    it('should have refreshed in the background so the next request is fresh', () => {
      expect(served[2]).toEqual(['v2'])
    })

    it('should fetch upstream exactly once for the refresh', () => {
      expect(fetchElements).toHaveBeenCalledTimes(2)
    })
  })
})

describe('when stale serving is off for a fetcher', () => {
  let fetchElements: jest.Mock
  let fetcher: ElementsFetcher<string>

  beforeEach(() => {
    fetchElements = jest.fn()
    fetcher = createElementsFetcherComponent<string>({ logs } as any, fetchElements, {
      maxEntries: 10,
      maxAge: 20,
      serveStale: false
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the entry has expired', () => {
    let served: string[][]

    beforeEach(async () => {
      let call = 0
      fetchElements.mockImplementation(async () => settled([`v${++call}`]))
      served = [(await fetcher.fetchOwnedElements('0x1')).elements]
      await new Promise((resolve) => setTimeout(resolve, 40))
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
    })

    it('should block on the refresh and answer with the fresh value', () => {
      expect(served).toEqual([['v1'], ['v2']])
    })
  })

  describe('and the entry has expired while the upstream is down', () => {
    beforeEach(async () => {
      fetchElements.mockResolvedValueOnce(settled(['owner-1'])).mockRejectedValue(new Error('upstream down'))
      await fetcher.fetchOwnedElements('0x1')
      await new Promise((resolve) => setTimeout(resolve, 40))
    })

    it('should fail closed instead of confidently serving the previous answer', async () => {
      await expect(fetcher.fetchOwnedElements('0x1')).rejects.toThrow(FetcherError)
    })
  })
})

describe('when the elements cache is metered', () => {
  let fetchElements: jest.Mock
  let metrics: { increment: jest.Mock }
  let fetcher: ElementsFetcher<string>

  function resultsRecorded(): string[] {
    return metrics.increment.mock.calls
      .filter(([name]) => name === 'elements_cache_reads_total')
      .map(([, labels]) => labels.result)
  }

  function refreshOutcomes(): string[] {
    return metrics.increment.mock.calls
      .filter(([name]) => name === 'elements_cache_background_refresh_total')
      .map(([, labels]) => labels.outcome)
  }

  beforeEach(() => {
    fetchElements = jest.fn()
    metrics = { increment: jest.fn() }
    fetcher = createElementsFetcherComponent<string>({ logs, metrics } as any, fetchElements, {
      maxEntries: 10,
      maxAge: 20,
      serveStale: true
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and an entry is read cold, warm, stale and warm again', () => {
    beforeEach(async () => {
      fetchElements.mockImplementation(async () => settled(['a']))
      await fetcher.fetchOwnedElements('0x1')
      await fetcher.fetchOwnedElements('0x1')
      await new Promise((resolve) => setTimeout(resolve, 40))
      await fetcher.fetchOwnedElements('0x1')
      await new Promise((resolve) => setTimeout(resolve, 10))
      await fetcher.fetchOwnedElements('0x1')
    })

    it('should record each read by what it cost', () => {
      expect(resultsRecorded()).toEqual(['miss', 'hit', 'stale', 'hit'])
    })

    it('should record the one background refresh as successful', () => {
      expect(refreshOutcomes()).toEqual(['ok'])
    })
  })

  describe('and the background refresh fails', () => {
    let served: string[][]

    beforeEach(async () => {
      fetchElements
        .mockResolvedValueOnce(settled(['v1']))
        .mockRejectedValueOnce(new Error('upstream down'))
        .mockResolvedValueOnce(settled(['v3']))
      served = [(await fetcher.fetchOwnedElements('0x1')).elements]
      await new Promise((resolve) => setTimeout(resolve, 40))
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
      await new Promise((resolve) => setTimeout(resolve, 10))
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
    })

    it('should still have served the stale value to the reader that triggered the refresh', () => {
      expect(served[1]).toEqual(['v1'])
    })

    it('should record the failed refresh, which is the signal the cache has stopped self-healing', () => {
      expect(refreshOutcomes()).toEqual(['failed'])
    })

    it('should drop the entry so the next read goes upstream again rather than serving it forever', () => {
      expect(served[2]).toEqual(['v3'])
    })
  })
})

describe('when reading the elements cache settings', () => {
  function configWith(values: Record<string, number>) {
    return { getNumber: jest.fn(async (key: string) => values[key]) } as any
  }

  describe('and nothing is configured', () => {
    let settings: Awaited<ReturnType<typeof readElementsCacheSettings>>

    beforeEach(async () => {
      settings = await readElementsCacheSettings(configWith({}))
    })

    it('should default owned elements to one minute, served stale while refreshing', () => {
      expect(settings.elements).toEqual({ maxEntries: 10000, maxAge: 60_000, serveStale: true })
    })

    it('should keep linked wearables at ten minutes, since filling that entry is expensive and rarely changes', () => {
      expect(settings.thirdPartyWearables).toEqual({ maxEntries: 10000, maxAge: 600_000, serveStale: true })
    })

    it('should never serve ownership decisions stale, so they fail closed on an outage', () => {
      expect(settings.ownershipDecisions).toEqual({ maxEntries: 10000, maxAge: 60_000, serveStale: false })
    })
  })

  describe('and ages are configured', () => {
    let settings: Awaited<ReturnType<typeof readElementsCacheSettings>>

    beforeEach(async () => {
      settings = await readElementsCacheSettings(
        configWith({ ELEMENTS_CACHE_MAX_AGE: 5000, THIRD_PARTY_WEARABLES_CACHE_MAX_AGE: 7000 })
      )
    })

    it('should apply each age to its own cache, ownership decisions following the elements age', () => {
      expect([
        settings.elements.maxAge,
        settings.thirdPartyWearables.maxAge,
        settings.ownershipDecisions.maxAge
      ]).toEqual([5000, 7000, 5000])
    })
  })

  describe('and a setting is not a positive integer', () => {
    it('should refuse to start rather than run with a broken cache', async () => {
      await expect(readElementsCacheSettings(configWith({ ELEMENTS_CACHE_MAX_AGE: 0 }))).rejects.toThrow(
        'ELEMENTS_CACHE_MAX_AGE'
      )
    })
  })
})
