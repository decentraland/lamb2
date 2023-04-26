import { Item } from '../types'
import { compareByRarity } from './utils'

function byUrn<T extends { urn: string }>(item1: T, item2: T): number {
  return item1.urn.localeCompare(item2.urn)
}

export function nameAZ<T extends { name: string; urn: string }>(item1: T, item2: T): number {
  return item1.name.localeCompare(item2.name) || byUrn(item1, item2)
}

export function nameZA<T extends { name: string; urn: string }>(item1: T, item2: T): number {
  return item2.name.localeCompare(item1.name) || byUrn(item1, item2)
}

export function rarest<T extends { rarity: string; urn: string }>(item1: T, item2: T): number {
  return compareByRarity(item1, item2) || byUrn(item1, item2)
}

export function leastRare<T extends { rarity: string; urn: string }>(item1: T, item2: T): number {
  return compareByRarity(item2, item1) || byUrn(item1, item2)
}

export function newest<T extends { maxTransferredAt: number; urn: string }>(item1: T, item2: T): number {
  return item2.maxTransferredAt - item1.maxTransferredAt || byUrn(item1, item2)
}

export function oldest<T extends { minTransferredAt: number; urn: string }>(item1: T, item2: T): number {
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
