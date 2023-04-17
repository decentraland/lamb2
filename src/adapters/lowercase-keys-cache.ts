import LRU, { LRUCache } from 'lru-cache'

// eslint-disable-next-line @typescript-eslint/ban-types
export type LowercaseKeysCache<V extends {}> = Pick<LRU<string, V>, 'get' | 'set' | 'has' | 'fetch'>

// eslint-disable-next-line @typescript-eslint/ban-types
export function createLowerCaseKeysCache<V extends {}>(
  options: LRUCache.Options<string, V, unknown> | LRUCache<string, V, unknown>
): LowercaseKeysCache<V> {
  const cache = new LRU<string, V>(options)
  return {
    get: (...args: Parameters<LowercaseKeysCache<V>['get']>) => {
      args[0] = args[0].toLowerCase()
      return cache.get(...args)
    },
    set(...args: Parameters<LowercaseKeysCache<V>['set']>) {
      args[0] = args[0].toLowerCase()
      return cache.set(...args)
    },
    has(...args: Parameters<LowercaseKeysCache<V>['has']>) {
      args[0] = args[0].toLowerCase()
      return cache.has(...args)
    },
    async fetch(...args: Parameters<LowercaseKeysCache<V>['fetch']>) {
      args[0] = args[0].toLowerCase()
      return cache.fetch(...args)
    }
  }
}
