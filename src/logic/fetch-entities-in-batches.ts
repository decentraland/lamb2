import { Entity } from '@dcl/schemas'
import { ILoggerComponent } from '@well-known-components/interfaces'

/**
 * The content server validates `POST /entities/active` against a JSON schema that caps
 * `pointers` at 1000 items, answering 400 when it is exceeded. Batches stay under that cap
 * with headroom so wallets owning more items than the limit can still be resolved.
 */
export const MAX_POINTERS_PER_REQUEST = 900

/**
 * Batches run concurrently but bounded: the cap above exists to keep the underlying
 * `ANY(...)` query cheap on a public endpoint, so one request for a wallet with many items
 * must not fan out into an unbounded burst of those queries. The bound is per call, so
 * concurrent requests still add up; a process-wide limit would need a shared semaphore.
 */
export const MAX_CONCURRENT_POINTER_REQUESTS = 4

/** Thrown when a batch fails, after the batches still in flight have been cancelled. */
export class EntityBatchFailedError extends Error {
  constructor(public readonly reason: unknown) {
    super(`Failed to fetch a batch of entities: ${reason instanceof Error ? reason.message : 'Unknown error'}`)
  }
}

/**
 * Resolves pointers through `fetchBatch` in batches small enough for the content server to
 * accept, with bounded concurrency. Entities come back in completion order, not pointer
 * order, so callers must key them rather than zip them against the input.
 *
 * A result missing entities is indistinguishable from a wallet that owns nothing, so any
 * failing batch fails the whole call: the shared abort controller cancels the batches still
 * in flight, and the original failure is reported rather than the cancellations it caused.
 */
export async function fetchEntitiesInBatches(
  pointers: string[],
  fetchBatch: (batch: string[], options: { abortController: AbortController }) => Promise<Entity[]>,
  logger: ILoggerComponent.ILogger
): Promise<Entity[]> {
  const batches: string[][] = []
  for (let index = 0; index < pointers.length; index += MAX_POINTERS_PER_REQUEST) {
    batches.push(pointers.slice(index, index + MAX_POINTERS_PER_REQUEST))
  }

  const entities: Entity[] = []
  const abortController = new AbortController()
  let nextBatch = 0
  let firstError: unknown

  async function worker(): Promise<void> {
    while (nextBatch < batches.length && !abortController.signal.aborted) {
      const batch = batches[nextBatch++]

      try {
        entities.push(...(await fetchBatch(batch, { abortController })))
      } catch (error) {
        // Keep the first failure: the batches cancelled below reject with an abort error
        // that would otherwise bury the reason the call failed.
        if (!abortController.signal.aborted) {
          firstError = error
          abortController.abort()
        }

        throw error
      }
    }
  }

  const workers = Math.min(MAX_CONCURRENT_POINTER_REQUESTS, batches.length)

  try {
    await Promise.all(Array.from({ length: workers }, () => worker()))
  } catch (error) {
    const reason = firstError ?? error
    logger.warn('Cancelled the remaining entity batches after one of them failed', {
      batches: batches.length,
      error: reason instanceof Error ? reason.message : 'Unknown error'
    })

    throw new EntityBatchFailedError(reason)
  }

  return entities
}
