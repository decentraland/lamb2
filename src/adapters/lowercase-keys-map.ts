export function createLowerCaseKeysMap<V>(): Map<string, V> {
  const map = new Map()
  const { get, set, has, ...restOfMap } = map
  return {
    get(key: string): V | undefined {
      return map.get(key.toLowerCase())
    },
    set(key: string, value: V) {
      return map.set(key.toLowerCase(), value)
    },
    has(key: string) {
      return map.has(key.toLowerCase())
    },
    ...restOfMap
  }
}
