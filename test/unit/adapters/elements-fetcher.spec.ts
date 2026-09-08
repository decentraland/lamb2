import {
  createElementsFetcherComponent,
  ElementsFetcher,
  FetcherError,
  readElementsCacheSettings
} from '../../../src/adapters/elements-fetcher'

const logs = {
  getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() })
}

const ONE_MINUTE = 60_000

function settled(elements: string[]) {
  return { elements, totalAmount: elements.length }
}

/**
 * lru-cache reads its TTL clock through `performance.now()`, so the tests drive time by offsetting
 * that clock instead of sleeping; nothing here depends on how fast the machine is. The only real
 * wait is a few milliseconds after each jump, because lru-cache debounces its clock reads for 1 ms.
 */
function installClock() {
  const realNow = performance.now.bind(performance)
  let offset = 0
  jest.spyOn(performance, 'now').mockImplementation(() => realNow() + offset)

  return {
    async advance(ms: number): Promise<void> {
      offset += ms
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }
}

/** Lets every pending promise chain, including lru-cache's own, run to completion. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))
}

/** An upstream call the test releases explicitly, so overlap between requests is arranged, not timed. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('when fetching owned elements', () => {
  let fetchElements: jest.Mock
  let fetcher: ElementsFetcher<string>

  beforeEach(() => {
    fetchElements = jest.fn()
    fetcher = createElementsFetcherComponent<string>({ logs } as any, fetchElements)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('and a second request for the same address arrives while the first is in flight', () => {
    let results: Awaited<ReturnType<ElementsFetcher<string>['fetchOwnedElements']>>[]

    beforeEach(async () => {
      const upstream = deferred<ReturnType<typeof settled>>()
      fetchElements.mockReturnValue(upstream.promise)
      const requests = Promise.all([fetcher.fetchOwnedElements('0xAbC'), fetcher.fetchOwnedElements('0xabc')])
      upstream.resolve(settled(['a']))
      results = await requests
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

  describe('and the same address is requested for two different pages', () => {
    beforeEach(async () => {
      fetchElements.mockResolvedValue(settled([]))
      await fetcher.fetchOwnedElements('0x1', { pageSize: 10, pageNum: 1 })
      await fetcher.fetchOwnedElements('0x1', { pageSize: 10, pageNum: 2 })
    })

    it('should keep one entry per page', () => {
      expect(fetchElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and the upstream fails while requests are waiting on it', () => {
    let outcomes: PromiseSettledResult<unknown>[]

    beforeEach(async () => {
      const upstream = deferred<never>()
      fetchElements.mockReturnValue(upstream.promise)
      const requests = Promise.allSettled([fetcher.fetchOwnedElements('0x1'), fetcher.fetchOwnedElements('0x1')])
      upstream.reject(new Error('upstream down'))
      outcomes = await requests
    })

    it('should fail both requests from the single upstream attempt', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })

    it('should report the failure as a fetcher error to every waiter', () => {
      expect(
        outcomes.map((outcome) => outcome.status === 'rejected' && outcome.reason instanceof FetcherError)
      ).toEqual([true, true])
    })

    describe('and the next request for that address arrives', () => {
      beforeEach(async () => {
        fetchElements.mockResolvedValueOnce(settled(['b']))
        await fetcher.fetchOwnedElements('0x1')
      })

      it('should try upstream again instead of remembering the failure', () => {
        expect(fetchElements).toHaveBeenCalledTimes(2)
      })
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
      const upstream = deferred<ReturnType<typeof settled>>()
      fetchElements.mockReturnValue(upstream.promise)
      const requests = Promise.all([
        fetcher.fetchOwnedElements('0x1', undefined, { name: 'Foo' }),
        fetcher.fetchOwnedElements('0x1', undefined, { name: 'foo' })
      ])
      upstream.resolve(settled(['a']))
      await requests
    })

    it('should treat them as the same request, since filters match case-insensitively downstream', () => {
      expect(fetchElements).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the entry has gone stale within the grace window', () => {
    let served: string[][]

    beforeEach(async () => {
      const clock = installClock()
      let call = 0
      fetchElements.mockImplementation(async () => settled([`v${++call}`]))
      fetcher = createElementsFetcherComponent<string>({ logs } as any, fetchElements, {
        maxEntries: 10,
        maxAge: ONE_MINUTE,
        maxStaleAge: ONE_MINUTE,
        serveStale: true
      })
      served = [(await fetcher.fetchOwnedElements('0x1')).elements]
      await clock.advance(ONE_MINUTE * 1.5)
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
      await flush()
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
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
  let clock: ReturnType<typeof installClock>

  beforeEach(() => {
    clock = installClock()
    fetchElements = jest.fn()
    fetcher = createElementsFetcherComponent<string>({ logs } as any, fetchElements, {
      maxEntries: 10,
      maxAge: ONE_MINUTE,
      maxStaleAge: 0,
      serveStale: false
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('and the entry has expired', () => {
    let served: string[][]

    beforeEach(async () => {
      let call = 0
      fetchElements.mockImplementation(async () => settled([`v${++call}`]))
      served = [(await fetcher.fetchOwnedElements('0x1')).elements]
      await clock.advance(ONE_MINUTE * 1.5)
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
    })

    it('should block on the refresh and answer with the fresh value', () => {
      expect(served).toEqual([['v1'], ['v2']])
    })
  })

  describe('and the entry has expired while the upstream is down', () => {
    let outcome: PromiseSettledResult<unknown>

    beforeEach(async () => {
      fetchElements.mockResolvedValueOnce(settled(['owner-1'])).mockRejectedValue(new Error('upstream down'))
      await fetcher.fetchOwnedElements('0x1')
      await clock.advance(ONE_MINUTE * 1.5)
      ;[outcome] = await Promise.allSettled([fetcher.fetchOwnedElements('0x1')])
    })

    it('should fail closed instead of confidently serving the previous answer', () => {
      expect(outcome.status === 'rejected' && outcome.reason instanceof FetcherError).toBe(true)
    })
  })
})

describe('when the elements cache is metered', () => {
  let fetchElements: jest.Mock
  let metrics: { increment: jest.Mock }
  let fetcher: ElementsFetcher<string>
  let clock: ReturnType<typeof installClock>

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
    clock = installClock()
    fetchElements = jest.fn()
    metrics = { increment: jest.fn() }
    fetcher = createElementsFetcherComponent<string>({ logs, metrics } as any, fetchElements, {
      maxEntries: 10,
      maxAge: ONE_MINUTE,
      maxStaleAge: ONE_MINUTE,
      serveStale: true
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('and an entry is read cold, warm, stale and warm again', () => {
    beforeEach(async () => {
      fetchElements.mockImplementation(async () => settled(['a']))
      await fetcher.fetchOwnedElements('0x1')
      await fetcher.fetchOwnedElements('0x1')
      await clock.advance(ONE_MINUTE * 1.5)
      await fetcher.fetchOwnedElements('0x1')
      await flush()
      await fetcher.fetchOwnedElements('0x1')
    })

    it('should record each read by what it cost', () => {
      expect(resultsRecorded()).toEqual(['miss', 'hit', 'stale', 'hit'])
    })

    it('should record the one background refresh as successful', () => {
      expect(refreshOutcomes()).toEqual(['ok'])
    })
  })

  describe('and an entry has been idle past the grace window', () => {
    let served: string[][]

    beforeEach(async () => {
      let call = 0
      fetchElements.mockImplementation(async () => settled([`v${++call}`]))
      served = [(await fetcher.fetchOwnedElements('0x1')).elements]
      await clock.advance(ONE_MINUTE * 2.5)
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
    })

    it('should not trust the old entry: the read blocks and answers with the fresh value', () => {
      expect(served).toEqual([['v1'], ['v2']])
    })

    it('should record that read as a miss, since it waited on upstream', () => {
      expect(resultsRecorded()).toEqual(['miss', 'miss'])
    })

    it('should not count the blocking refresh as a background one', () => {
      expect(refreshOutcomes()).toEqual([])
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
      await clock.advance(ONE_MINUTE * 1.5)
      served.push((await fetcher.fetchOwnedElements('0x1')).elements)
      await flush()
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
      expect(settings.elements).toEqual({ maxEntries: 10000, maxAge: 60_000, maxStaleAge: 60_000, serveStale: true })
    })

    it('should keep linked wearables at ten minutes, since filling that entry is expensive and rarely changes', () => {
      expect(settings.thirdPartyWearables).toEqual({
        maxEntries: 10000,
        maxAge: 600_000,
        maxStaleAge: 60_000,
        serveStale: true
      })
    })

    it('should never serve ownership decisions stale, so they fail closed on an outage', () => {
      expect(settings.ownershipDecisions).toEqual({
        maxEntries: 10000,
        maxAge: 60_000,
        maxStaleAge: 0,
        serveStale: false
      })
    })
  })

  describe('and ages are configured', () => {
    let settings: Awaited<ReturnType<typeof readElementsCacheSettings>>

    beforeEach(async () => {
      settings = await readElementsCacheSettings(
        configWith({
          ELEMENTS_CACHE_MAX_AGE: 5000,
          THIRD_PARTY_WEARABLES_CACHE_MAX_AGE: 7000,
          ELEMENTS_CACHE_MAX_STALE_AGE: 9000
        })
      )
    })

    it('should apply each age to its own cache, ownership decisions following the elements age', () => {
      expect([
        settings.elements.maxAge,
        settings.thirdPartyWearables.maxAge,
        settings.ownershipDecisions.maxAge
      ]).toEqual([5000, 7000, 5000])
    })

    it('should apply the grace window to every fetcher that serves stale', () => {
      expect([settings.elements.maxStaleAge, settings.thirdPartyWearables.maxStaleAge]).toEqual([9000, 9000])
    })
  })

  describe('and a setting is not a positive integer', () => {
    let outcome: PromiseSettledResult<unknown>

    beforeEach(async () => {
      ;[outcome] = await Promise.allSettled([readElementsCacheSettings(configWith({ ELEMENTS_CACHE_MAX_AGE: 0 }))])
    })

    it('should refuse to start rather than run with a broken cache', () => {
      expect(outcome.status === 'rejected' && String(outcome.reason)).toContain('ELEMENTS_CACHE_MAX_AGE')
    })
  })
})
