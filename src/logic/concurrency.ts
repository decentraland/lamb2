/**
 * Maps `items` through `fn` with at most `limit` calls in flight, preserving order. Workers pull
 * the next item as soon as they finish, so one slow item never idles the other slots. The first
 * failure stops the remaining items from starting and is what the returned promise rejects with.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  let failed = false

  async function worker(): Promise<void> {
    while (next < items.length && !failed) {
      const index = next++
      try {
        results[index] = await fn(items[index], index)
      } catch (error) {
        failed = true
        throw error
      }
    }
  }

  const workers = Math.min(Math.max(limit, 1), items.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))
  return results
}
