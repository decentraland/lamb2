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

export function createSorting(url: URL): (item1: Item, item2: Item) => number {
  const sort = url.searchParams.has('sort') ? url.searchParams.get('sort') : undefined
  if (sort === 'name_a_z') {
    return (item1, item2) => item1.name.localeCompare(item2.name)
  }
  if (sort === 'name_z_a') {
    return (item1, item2) => item2.name.localeCompare(item1.name)
  }
  if (sort === 'rarest') {
    return compareByRarity
  }
  if (sort === 'less_rare') {
    return (item1, item2) => compareByRarity(item2, item1)
  }
  if (sort === 'newest') {
    return (item1, item2) => item1.maxTransferredAt - item2.maxTransferredAt
  }
  if (sort === 'oldest') {
    return (item1, item2) => item1.minTransferredAt - item2.minTransferredAt
  }

  // Existing behavior (when no particular sort requested) is to sort by rarity
  return compareByRarity
}
