import { EmoteCategory, Rarity, WearableCategory } from '@dcl/schemas'
import { SORTED_RARITIES } from '../../logic/utils'
import { InvalidRequestError, ExplorerWearableEntity } from '../../types'

export type FilterableItem = {
  name: string
  category: WearableCategory | EmoteCategory
  rarity?: string
}

// Type guard to check if an item is a trimmed response
function isTrimmedResponse(item: any): item is { type: string; entity: ExplorerWearableEntity } {
  return item && typeof item === 'object' && 'entity' in item && !('name' in item)
}

export function createFilters(url: URL): (item: any) => boolean {
  const categories = url.searchParams.has('category')
    ? url.searchParams.getAll('category').map((category) => category.toLowerCase())
    : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name')!.toLowerCase() : undefined
  const rarity = url.searchParams.has('rarity') ? url.searchParams.get('rarity')!.toLowerCase() : undefined

  if (rarity && !SORTED_RARITIES.includes(rarity as Rarity)) {
    throw new InvalidRequestError(`Invalid rarity requested: '${rarity}'.`)
  }

  return (item: any) => {
    // Check if it's a trimmed response
    if (isTrimmedResponse(item)) {
      // For trimmed responses, we can only filter by category and rarity (name is not available)
      if (rarity && (!item.entity.metadata.rarity || item.entity.metadata.rarity !== rarity)) {
        return false
      }
      if (
        categories &&
        categories.length > 0 &&
        (!item.entity.metadata.data.category || !categories.includes(item.entity.metadata.data.category))
      ) {
        return false
      }
      // Note: Name filtering is not available for trimmed responses since the name is not included
      return true
    } else {
      // For non-trimmed responses, use the original logic
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
}
