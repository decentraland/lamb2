import { resolveUrn } from './utils'

/*
 * Merge map1 into map2. They must be { string -> [string] } maps
 */
export function mergeMapIntoMap(map1: Map<string, string[]>, map2: Map<string, string[]>) {
  for (const [key, val] of map1) {
    if (map2.has(key)) {
      const map2Val = map2.get(key) ?? []
      map2.set(key, map2Val?.concat(val))
    } else {
      map2.set(key, val)
    }
  }
}

export function mergeMapIntoMapExtended(
  map1: Map<string, string[]>,
  map2: Map<string, { urn: string; tokenId: string }[]>
) {
  for (const [key, val] of map1) {
    const parsedVal = val.map(resolveUrn)
    if (map2.has(key)) {
      const map2Val = map2.get(key) ?? []
      map2.set(key, map2Val.concat(parsedVal))
    } else {
      map2.set(key, parsedVal)
    }
  }
}
