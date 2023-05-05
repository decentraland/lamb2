import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { RARITIES } from '../../logic/utils'
import { InvalidRequestError } from '../../types'

export type FilterableItem = {
  name: string
  category: WearableCategory | EmoteCategory
  rarity?: string
}

export function createFilters(url: URL): (item: FilterableItem) => boolean {
  const categories = url.searchParams.has('category')
    ? url.searchParams.getAll('category').map((category) => category.toLowerCase())
    : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name')!.toLowerCase() : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity')!.toLowerCase() : undefined

  if (rarity && !RARITIES.includes(rarity)) {
    throw new InvalidRequestError(`Invalid rarity requested: '${rarity}'.`)
  }

  return (item: FilterableItem) => {
    if (rarity && (!item.rarity || item.rarity !== rarity)) {
      return false
    }
    if (name && (!item.name || !item.name.toLowerCase().includes(name))) {
      return false
    }
    if (categories && categories.length > 0 && (!item.category || !categories.includes(item.category))) {
      return false
    }
    return true
  }
}
