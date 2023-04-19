import { Item } from '../../types'
import { compareByRarity } from '../../logic/utils'

export function createFilters(url: URL): (item: Item) => boolean {
  const categories = url.searchParams.has('category') ? url.searchParams.getAll('category') : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name') : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity') : undefined

  return (item: Item) => {
    if (rarity && item.rarity !== rarity) {
      return false
    }
    if (name && !item.name.toLowerCase().includes(name.toLowerCase())) {
      return false
    }
    if (categories && categories.length > 0 && !categories.includes(item.category)) {
      return false
    }
    return true
  }
}

export const sortUrn: SortingFunction = (item1: Item, item2: Item): number => item1.urn.localeCompare(item2.urn)
export const nameAZ: SortingFunction = (item1: Item, item2: Item): number => {
  return item1.name.localeCompare(item2.name) || sortUrn(item1, item2)
}
export const nameZA: SortingFunction = (item1: Item, item2: Item): number => {
  return item2.name.localeCompare(item1.name) || sortUrn(item1, item2)
}
export const rarest: SortingFunction = (item1: Item, item2: Item): number => {
  return compareByRarity(item1, item2) || sortUrn(item1, item2)
}
export const leastRare: SortingFunction = (item1: Item, item2: Item): number => {
  return compareByRarity(item2, item1) || sortUrn(item1, item2)
}
export const newest: SortingFunction = (item1: Item, item2: Item): number => {
  return item1.maxTransferredAt - item2.maxTransferredAt || sortUrn(item1, item2)
}
export const oldest: SortingFunction = (item1: Item, item2: Item): number => {
  return item2.minTransferredAt - item1.minTransferredAt || sortUrn(item1, item2)
}

type SortingFunction = (item1: Item, item2: Item) => number

const sortings: Record<string, SortingFunction> = {
  name_a_z: nameAZ,
  name_z_a: nameZA,
  rarest: rarest,
  less_rare: leastRare,
  newest: newest,
  oldest: oldest
}

export function createSorting(url: URL): SortingFunction {
  const sort = url.searchParams.has('sort') ? url.searchParams.get('sort')! : 'rarest'
  // When no particular sort requested, always to sort by rarity
  return sortings[sort] || compareByRarity
}
