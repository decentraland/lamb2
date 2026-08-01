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
 * must not fan out into an unbounded burst of those queries.
 */
export const MAX_CONCURRENT_POINTER_REQUESTS = 4

/**
 * Resolves pointers through `fetchBatch` in batches small enough for the content server to
 * accept, with bounded concurrency. A batch that fails costs only its own entities: the
 * returned array holds whatever resolved, since callers already treat an unresolved pointer
 * as a miss.
 */
export async function fetchEntitiesInBatches(
  pointers: string[],
  fetchBatch: (batch: string[]) => Promise<Entity[]>,
  logger: ILoggerComponent.ILogger
): Promise<Entity[]> {
  const batches: string[][] = []
  for (let index = 0; index < pointers.length; index += MAX_POINTERS_PER_REQUEST) {
    batches.push(pointers.slice(index, index + MAX_POINTERS_PER_REQUEST))
  }

  const entities: Entity[] = []
  let nextBatch = 0

  async function worker(): Promise<void> {
    while (nextBatch < batches.length) {
      const batch = batches[nextBatch++]

      try {
        entities.push(...(await fetchBatch(batch)))
      } catch (error) {
        logger.warn('Failed to fetch a batch of entities', {
          pointers: batch.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  const workers = Math.min(MAX_CONCURRENT_POINTER_REQUESTS, batches.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))

  return entities
}
