/**
 * Maps `items` through `fn` with at most `limit` calls in flight, preserving order. Workers pull
 * the next item as soon as they finish, so one slow item never idles the other slots. After the
 * first failure no further item starts, and the returned promise rejects with that failure only
 * once every call already started has settled, so a caller holding a resource around this can
 * release it knowing nothing is still running.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  let failed = false
  let firstFailure: unknown

  async function worker(): Promise<void> {
    while (next < items.length && !failed) {
      const index = next++
      try {
        results[index] = await fn(items[index], index)
      } catch (error) {
        if (!failed) {
          failed = true
          firstFailure = error
        }
      }
    }
  }

  const workers = Math.min(Math.max(limit, 1), items.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))

  if (failed) {
    throw firstFailure
  }

  return results
}

/** Thrown by a bulkhead that has no slot free and no room left in its queue. */
export class BulkheadSaturatedError extends Error {
  constructor(limit: number, maxQueued: number) {
    super(`Bulkhead saturated: ${limit} running and ${maxQueued} queued`)
    this.name = 'BulkheadSaturatedError'
  }
}

export type Bulkhead = {
  run<T>(fn: () => Promise<T>): Promise<T>
  stats(): { running: number; queued: number }
}

/**
 * Bounds how many calls run at once across every caller. Calls beyond `limit` wait in a queue
 * of at most `maxQueued`; beyond that they fail immediately, so an overload is shed instead of
 * piling up without bound. A finishing call hands its slot straight to the next waiter.
 */
export function createBulkhead(limit: number, maxQueued: number): Bulkhead {
  let running = 0
  const queue: Array<() => void> = []

  function release(): void {
    const next = queue.shift()
    if (next) {
      next()
    } else {
      running--
    }
  }

  async function acquire(): Promise<void> {
    if (running < limit) {
      running++
      return
    }

    if (queue.length >= maxQueued) {
      throw new BulkheadSaturatedError(limit, maxQueued)
    }

    await new Promise<void>((resolve) => queue.push(resolve))
  }

  return {
    async run(fn) {
      await acquire()
      try {
        return await fn()
      } finally {
        release()
      }
    },
    stats() {
      return { running, queued: queue.length }
    }
  }
}
