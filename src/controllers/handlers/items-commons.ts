import { rarest, SortingFunction, SORTING } from '../../logic/sorting'
import { FilterableItem } from '../../types'

export function createFilters(url: URL): (item: FilterableItem) => boolean {
  const categories = url.searchParams.has('category') ? url.searchParams.getAll('category') : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name') : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity') : undefined

  return (item: FilterableItem) => {
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

export function createSorting(url: URL): SortingFunction {
  const sort = url.searchParams.has('sort') ? url.searchParams.get('sort')! : 'rarest'
  // When no particular sort requested, always sort by rarity
  return SORTING[sort] || rarest
}
