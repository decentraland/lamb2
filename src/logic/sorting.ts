import { Item } from '../types'
import { compareByRarity } from './utils'

const byUrn: SortingFunction = (item1: Item, item2: Item): number => item1.urn.localeCompare(item2.urn)

export const nameAZ: SortingFunction = (item1: Item, item2: Item): number => {
  return item1.name.localeCompare(item2.name) || byUrn(item1, item2)
}

export const nameZA: SortingFunction = (item1: Item, item2: Item): number => {
  return item2.name.localeCompare(item1.name) || byUrn(item1, item2)
}

export const rarest: SortingFunction = (item1: Item, item2: Item): number => {
  return compareByRarity(item1, item2) || byUrn(item1, item2)
}

export const leastRare: SortingFunction = (item1: Item, item2: Item): number => {
  return compareByRarity(item2, item1) || byUrn(item1, item2)
}

export const newest: SortingFunction = (item1: Item, item2: Item): number => {
  return item2.maxTransferredAt - item1.maxTransferredAt || byUrn(item1, item2)
}

export const oldest: SortingFunction = (item1: Item, item2: Item): number => {
  return item1.minTransferredAt - item2.minTransferredAt || byUrn(item1, item2)
}

export type SortingFunction = (item1: Item, item2: Item) => number

export const SORTING: Record<string, SortingFunction> = {
  name_a_z: nameAZ,
  name_z_a: nameZA,
  rarest: rarest,
  least_rare: leastRare,
  newest: newest,
  oldest: oldest
}
