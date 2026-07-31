import { createLogComponent } from '@well-known-components/logger'
import { createElementsFetcherComponent } from '../../../src/adapters/elements-fetcher'

it('when fetch successes, it returns the elements', async () => {
  const logs = await createLogComponent({})
  const expectedElements = [1, 2, 3]
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      return {
        elements: expectedElements,
        totalAmount: expectedElements.length
      }
    }
  )
  const result = await fetcher.fetchOwnedElements(expectedAddress)

  expect(result.elements).toEqual(expectedElements)
  expect(result.totalAmount).toEqual(expectedElements.length)
})

it('it fetches the elements for the specified address', async () => {
  const logs = await createLogComponent({})
  const elementsA = [1, 2, 3]
  const elementsB = [4, 5, 6]
  const addressA = 'addressA'
  const addressB = 'addressB'
  const elementsByAddress = {
    addressa: elementsA,
    addressb: elementsB
  }
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      const elements = elementsByAddress[address]
      return {
        elements,
        totalAmount: elements.length
      }
    }
  )

  expect(await fetcher.fetchOwnedElements(addressA)).toEqual({ elements: elementsA, totalAmount: elementsA.length })
  expect(await fetcher.fetchOwnedElements(addressB)).toEqual({ elements: elementsB, totalAmount: elementsB.length })
})

it('when fetches fail and there is no stale value, it throws error', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      throw new Error('an error happenned')
    }
  )

  await expect(fetcher.fetchOwnedElements(expectedAddress)).rejects.toThrowError(
    `Cannot fetch elements for ${expectedAddress}`
  )
})

it('result is cached (no case sensitive)', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  let i = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      if (i === 0) {
        i++
        return {
          elements: [0],
          totalAmount: 1
        }
      }
      return {
        elements: [1],
        totalAmount: 1
      }
    }
  )

  expect(await fetcher.fetchOwnedElements(expectedAddress)).toEqual({ elements: [0], totalAmount: 1 })
  expect(await fetcher.fetchOwnedElements(expectedAddress.toUpperCase())).toEqual({ elements: [0], totalAmount: 1 })
})

// These use REAL timers with short TTLs on purpose: lru-cache reads its own clock (performance.now,
// captured when the module loads), which jest's fake timers do not move — faking them made entries never
// expire, so the tests passed through the fresh-hit path and proved nothing.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const SHORT_TTL = 300
const EXPLORER = { ttl: SHORT_TTL, serveStale: true }

function countingFetcher(logs: any, onCall?: () => void) {
  let calls = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async () => {
      calls++
      onCall?.()
      return { elements: [calls], totalAmount: 1 }
    }
  )
  return { fetcher, calls: () => calls }
}

it('serves the cached result until the given ttl expires', async () => {
  const logs = await createLogComponent({})
  const { fetcher, calls } = countingFetcher(logs)

  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
  await sleep(SHORT_TTL / 3)
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
  expect(calls()).toBe(1)
})

it('answers with the stale result and refreshes behind the request once the ttl expires', async () => {
  const logs = await createLogComponent({})
  const { fetcher, calls } = countingFetcher(logs)

  await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)
  await sleep(SHORT_TTL * 2)

  // Past the ttl the caller is not made to wait: it gets the previous value…
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
  // …while a refresh runs behind it, so the NEXT read is up to date.
  expect(calls()).toBe(2)
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [2],
    totalAmount: 1
  })
})

// THE regression this change exists for. The cache is shared and the keys collide — /explorer/:address/
// emotes and the profiles path both key on nothing but the address — so if the age of an entry were
// decided by whoever wrote it, a profile fetch (default TTL) would pin the entry as fresh for ten minutes
// and the backpack would be handed the pre-purchase list with no refresh. That is what shipped the bug.
it('does not let a default-ttl writer pin the entry against a short-ttl reader', async () => {
  const logs = await createLogComponent({})
  const { fetcher, calls } = countingFetcher(logs)

  // Someone walks past the user → profiles warms the key on the default (minutes-long) TTL.
  await fetcher.fetchOwnedElements('anAddress')
  await sleep(SHORT_TTL * 2)

  // The backpack asks the same key with its own short TTL: too old for IT, so it must refresh.
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
  expect(calls()).toBe(2)
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [2],
    totalAmount: 1
  })
})

it('does not apply the short ttl to callers that did not ask for one', async () => {
  const logs = await createLogComponent({})
  const { fetcher, calls } = countingFetcher(logs)

  // The fetchers are shared with /users/:address/* — those keep the default (minutes-long) TTL, so a
  // wait far longer than the explorer TTL must NOT trigger a refetch for them.
  await fetcher.fetchOwnedElements('anAddress')
  await sleep(SHORT_TTL * 2)
  expect(await fetcher.fetchOwnedElements('anAddress')).toEqual({ elements: [1], totalAmount: 1 })
  expect(calls()).toBe(1)
})

it('collapses concurrent misses into a single upstream fetch', async () => {
  const logs = await createLogComponent({})
  let calls = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async () => {
      calls++
      await sleep(10)
      return { elements: [calls], totalAmount: 1 }
    }
  )

  // A cold cache hit by several requests at once must not fan out to the upstream API once each: the
  // explorer routes pull a user's whole item list, so that is the expensive case to collapse.
  const results = await Promise.all([
    fetcher.fetchOwnedElements('anAddress'),
    fetcher.fetchOwnedElements('anAddress'),
    fetcher.fetchOwnedElements('anAddress')
  ])

  expect(calls).toBe(1)
  expect(results).toEqual([
    { elements: [1], totalAmount: 1 },
    { elements: [1], totalAmount: 1 },
    { elements: [1], totalAmount: 1 }
  ])
})

it('keeps serving the stale result when the refresh fails', async () => {
  const logs = await createLogComponent({})
  let calls = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async () => {
      calls++
      if (calls > 1) throw new Error('upstream is down')
      return { elements: [1], totalAmount: 1 }
    }
  )

  await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)
  await sleep(SHORT_TTL * 2)

  // An upstream outage must not turn a populated backpack into an error.
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
  await sleep(20)
  expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
    elements: [1],
    totalAmount: 1
  })
})

// Ownership answers must keep failing CLOSED. Before serveStale existed, an upstream outage threw and the
// route 5xx'd; serving a months-old owner with a 200 instead would be worse than an error, so callers
// that did not opt in still get the throw.
it('throws instead of serving stale for callers that did not opt in', async () => {
  const logs = await createLogComponent({})
  let calls = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async () => {
      calls++
      if (calls > 1) throw new Error('upstream is down')
      return { elements: [1], totalAmount: 1 }
    }
  )

  await fetcher.fetchOwnedElements('anAddress', undefined, undefined, { ttl: SHORT_TTL })
  await sleep(SHORT_TTL * 2)

  await expect(fetcher.fetchOwnedElements('anAddress', undefined, undefined, { ttl: SHORT_TTL })).rejects.toThrow(
    'Cannot fetch elements for anAddress'
  )
})

it('caps how many refreshes run detached from a request', async () => {
  const logs = await createLogComponent({})
  const addresses = Array.from({ length: 80 }, (_, i) => `address-${i}`)
  let inFlight = 0
  let peak = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await sleep(50)
      inFlight--
      return { elements: [1], totalAmount: 1 }
    }
  )

  // Prime every key, let them all go stale, then read them all at once. Each read answers instantly from
  // the stale entry, so nothing upstream throttles the refreshes — the ceiling has to.
  await Promise.all(addresses.map((a) => fetcher.fetchOwnedElements(a, undefined, undefined, EXPLORER)))
  await sleep(SHORT_TTL * 2)
  // Priming ran 80 loads at once, but each had a caller awaiting it — those are request-bound and are
  // NOT what the ceiling governs. Only the detached refreshes below are.
  peak = 0
  await Promise.all(addresses.map((a) => fetcher.fetchOwnedElements(a, undefined, undefined, EXPLORER)))

  expect(peak).toBeGreaterThan(0)
  expect(peak).toBeLessThanOrEqual(50)
})

// Without an age ceiling this branch made things WORSE than a plain expiring cache: entries are never
// dropped on their own, so an hours-old list would be served forever, while a cache that simply expired
// would have refetched and shown the purchase. Past the retention ceiling the caller must block.
//
// The age is measured with the fetcher's own monotonic clock, so shifting that is enough to age an entry
// past the ten-minute ceiling — no waiting, and no dependence on lru-cache's internal clock.
it('blocks instead of serving stale once the entry passes the retention ceiling', async () => {
  const logs = await createLogComponent({})
  const { fetcher, calls } = countingFetcher(logs)
  const realNow = performance.now.bind(performance)

  await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)
  expect(calls()).toBe(1)

  const elevenMinutes = 11 * 60 * 1000
  const clock = jest.spyOn(performance, 'now').mockImplementation(() => realNow() + elevenMinutes)
  try {
    // Not the previous value — the caller waited and got the current one.
    expect(await fetcher.fetchOwnedElements('anAddress', undefined, undefined, EXPLORER)).toEqual({
      elements: [2],
      totalAmount: 1
    })
    expect(calls()).toBe(2)
  } finally {
    clock.mockRestore()
  }
})

// The ceiling on detached refreshes must not be spent by loads that have a caller waiting on them.
// Sharing one number let ordinary traffic (a big POST /profiles fans out one load per id) exhaust the
// budget, so the backpack served stale and scheduled nothing to heal it — silently.
it('does not let request-blocking loads exhaust the background-refresh budget', async () => {
  const logs = await createLogComponent({})
  let backpackFetches = 0
  let release: (() => void) | undefined
  const blocked = new Promise<void>((resolve) => {
    release = resolve
  })
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address) => {
      if (address === 'backpack-user') {
        backpackFetches++
        return { elements: [backpackFetches], totalAmount: 1 }
      }
      await blocked // the profiles fan-out, parked upstream
      return { elements: [0], totalAmount: 1 }
    }
  )

  // Prime the backpack key and let it go stale.
  await fetcher.fetchOwnedElements('backpack-user', undefined, undefined, EXPLORER)
  await sleep(SHORT_TTL * 2)

  // 60 ordinary, request-bound loads now sit in flight — more than the ceiling.
  const parked = Array.from({ length: 60 }, (_, i) => fetcher.fetchOwnedElements(`profile-${i}`))
  await sleep(20)

  // The backpack read must still schedule its refresh.
  await fetcher.fetchOwnedElements('backpack-user', undefined, undefined, EXPLORER)
  expect(backpackFetches).toBe(2)

  release!()
  await Promise.all(parked)
})
