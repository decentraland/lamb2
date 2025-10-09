import { EmoteCategory, Rarity, WearableCategory, Entity } from '@dcl/schemas'
import { SORTED_RARITIES } from '../../logic/utils'
import { InvalidRequestError } from '../../types'

export type FilterableItem = {
  name: string
  category: WearableCategory | EmoteCategory
  rarity?: string
  entity?: Entity
}

function isSmartWearable(item: FilterableItem): boolean {
  if (!item.entity) {
    return false
  }

  return (
    item.entity.type === 'wearable' && item.entity.content?.some((content) => content.file.endsWith('.js')) === true
  )
}

export function createFilters(url: URL): (item: FilterableItem) => boolean {
  const categories = url.searchParams.has('category')
    ? url.searchParams.getAll('category').map((category) => category.toLowerCase())
    : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name')!.toLowerCase() : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity')!.toLowerCase() : undefined
  const isSmartWearablesParam = url.searchParams.get('isSmartWearable')
  const filterSmartWearable = isSmartWearablesParam === 'true' || isSmartWearablesParam === '1'

  if (rarity && !SORTED_RARITIES.includes(rarity as Rarity)) {
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
    if (filterSmartWearable && !isSmartWearable(item)) {
      return false
    }
    return true
  }
}
