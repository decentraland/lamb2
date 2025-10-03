import { SORTED_RARITIES } from './utils'
import { HasDate, HasName, HasRarity, HasUrn, InvalidRequestError, SortingFunction } from '../types'
import { MixedWearableResponse, MixedWearableTrimmedResponse } from '../controllers/handlers/explorer-handler'

function byUrn(item1: HasUrn, item2: HasUrn): number {
  return item1.urn.localeCompare(item2.urn)
}

export function compareByRarity<T extends HasRarity>(item1: T, item2: T) {
  const w1RarityValue = SORTED_RARITIES.findIndex((rarity) => rarity === item1.rarity)
  const w2RarityValue = SORTED_RARITIES.findIndex((rarity) => rarity === item2.rarity)
  return w2RarityValue - w1RarityValue
}

export function nameAZ(item1: HasName, item2: HasName): number {
  return item1.name.localeCompare(item2.name) || byUrn(item1, item2)
}

export function nameZA(item1: HasName, item2: HasName): number {
  return 0 - nameAZ(item1, item2)
}

export function rarest(item1: HasRarity, item2: HasRarity): number {
  return compareByRarity(item1, item2) || byUrn(item1, item2)
}

export function leastRare(item1: HasRarity, item2: HasRarity): number {
  return 0 - rarest(item1, item2)
}

export function newest(item1: HasDate, item2: HasDate): number {
  return item2.maxTransferredAt - item1.maxTransferredAt || byUrn(item1, item2)
}

export function oldest(item1: HasDate, item2: HasDate): number {
  return item1.minTransferredAt - item2.minTransferredAt || byUrn(item2, item1)
}

function hasRarity(item: Partial<HasRarity>): item is HasRarity {
  return !!item.rarity
}

export function rarestOptional(item1: HasUrn & Partial<HasRarity>, item2: HasUrn & Partial<HasRarity>): number {
  if (hasRarity(item1) && hasRarity(item2)) {
    return compareByRarity(item1, item2) || byUrn(item1, item2)
  } else if (!hasRarity(item1) && !hasRarity(item2)) {
    return byUrn(item1, item2)
  } else if (hasRarity(item1)) {
    return -1
  } else {
    return 1
  }
}

export function leastRareOptional(item1: HasUrn & Partial<HasRarity>, item2: HasUrn & Partial<HasRarity>): number {
  return 0 - rarestOptional(item1, item2)
}

function hasDate(item: Partial<HasDate>): item is HasDate {
  return !!item.maxTransferredAt && !!item.minTransferredAt
}

export function newestOptional(item1: HasUrn & Partial<HasDate>, item2: HasUrn & Partial<HasDate>): number {
  if (hasDate(item1) && hasDate(item2)) {
    return newest(item1, item2)
  } else if (!hasDate(item1) && !hasDate(item2)) {
    return byUrn(item1, item2)
  } else if (hasDate(item1)) {
    return -1
  } else {
    return 1
  }
}

export function oldestOptional(item1: HasUrn & Partial<HasDate>, item2: HasUrn & Partial<HasDate>): number {
  if (hasDate(item1) && hasDate(item2)) {
    return oldest(item1, item2)
  } else if (!hasDate(item1) && !hasDate(item2)) {
    return byUrn(item1, item2)
  } else if (hasDate(item1)) {
    return 1
  } else {
    return -1
  }
}

function sortDirectionParams(url: URL) {
  const sort = url.searchParams.has('orderBy') ? url.searchParams.get('orderBy')!.toLowerCase() : 'rarity'
  const direction = url.searchParams.has('direction')
    ? url.searchParams.get('direction')!.toUpperCase()
    : sort === 'name'
      ? 'ASC'
      : 'DESC'
  return { sort, direction }
}

export function createSorting<T extends HasName & HasRarity & HasDate>(url: URL): SortingFunction<T> {
  const { sort, direction } = sortDirectionParams(url)

  if (sort === 'rarity' && direction === 'ASC') {
    return leastRare
  } else if (sort === 'rarity' && direction === 'DESC') {
    return rarest
  } else if (sort === 'name' && direction === 'ASC') {
    return nameAZ
  } else if (sort === 'name' && direction === 'DESC') {
    return nameZA
  } else if (sort === 'date' && direction === 'ASC') {
    return oldest
  } else if (sort === 'date' && direction === 'DESC') {
    return newest
  } else {
    throw new InvalidRequestError(`Invalid sorting requested: ${sort} ${direction}`)
  }
}

export function createBaseSorting<T extends HasName>(url: URL): SortingFunction<T> {
  const sort = url.searchParams.has('orderBy') ? url.searchParams.get('orderBy')!.toLowerCase() : 'name'
  const direction = url.searchParams.has('direction')
    ? url.searchParams.get('direction')!.toUpperCase()
    : sort === 'name'
      ? 'ASC'
      : 'DESC'

  if (sort === 'name' && direction === 'ASC') {
    return nameAZ
  } else if (sort === 'name' && direction === 'DESC') {
    return nameZA
  } else {
    throw new InvalidRequestError(`Invalid sorting requested: ${sort} ${direction}`)
  }
}

export function createCombinedSorting<T extends HasName>(url: URL): SortingFunction<T> {
  const { sort, direction } = sortDirectionParams(url)

  if (sort === 'rarity' && direction === 'ASC') {
    return leastRareOptional
  } else if (sort === 'rarity' && direction === 'DESC') {
    return rarestOptional
  } else if (sort === 'name' && direction === 'ASC') {
    return nameAZ
  } else if (sort === 'name' && direction === 'DESC') {
    return nameZA
  } else if (sort === 'date' && direction === 'ASC') {
    return oldestOptional
  } else if (sort === 'date' && direction === 'DESC') {
    return newestOptional
  } else {
    throw new InvalidRequestError(
      `Invalid sorting requested: '${sort} ${direction}'. Valid options are '[rarity, name, date] [ASC, DESC]'.`
    )
  }
}

// Type guard to check if an item is a trimmed response
function isTrimmedResponse(item: MixedWearableResponse): item is MixedWearableTrimmedResponse {
  return item && typeof item === 'object' && 'entity' in item && !('name' in item)
}

// Helper function to get URN from either trimmed or non-trimmed response
function getUrn(item: MixedWearableResponse): string {
  if (isTrimmedResponse(item)) {
    return item.entity.id
  }
  return (item as any).urn || (item as any).id || ''
}

// Helper function to get name from either trimmed or non-trimmed response
function getName(item: MixedWearableResponse): string {
  if (isTrimmedResponse(item)) {
    // For trimmed responses, we don't have direct name access
    // We'll use the entity ID as a fallback for sorting
    return item.entity.id
  }
  return (item as any).name || ''
}

// Helper function to get rarity from either trimmed or non-trimmed response
function getRarity(item: MixedWearableResponse): string | undefined {
  if (isTrimmedResponse(item)) {
    return item.entity.metadata.rarity
  }
  return (item as any).rarity
}

// Universal sorting functions that work with both trimmed and non-trimmed responses
export function universalNameAZ(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  const name1: string = getName(item1)
  const name2: string = getName(item2)
  const result: number = name1.localeCompare(name2)
  if (result !== 0) {
    return result
  }

  // Fallback to URN comparison
  const urn1: string = getUrn(item1)
  const urn2: string = getUrn(item2)
  return urn1.localeCompare(urn2)
}

export function universalNameZA(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  return 0 - universalNameAZ(item1, item2)
}

export function universalRarest(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  const rarity1: string | undefined = getRarity(item1)
  const rarity2: string | undefined = getRarity(item2)

  if (!rarity1 && !rarity2) {
    return getUrn(item1).localeCompare(getUrn(item2))
  } else if (!rarity1) {
    return 1
  } else if (!rarity2) {
    return -1
  }

  const w1RarityValue: number = SORTED_RARITIES.findIndex((rarity) => rarity === rarity1)
  const w2RarityValue: number = SORTED_RARITIES.findIndex((rarity) => rarity === rarity2)
  const result: number = w2RarityValue - w1RarityValue

  if (result !== 0) {
    return result
  }

  // Fallback to URN comparison
  return getUrn(item1).localeCompare(getUrn(item2))
}

export function universalLeastRare(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  return 0 - universalRarest(item1, item2)
}

// For date sorting, trimmed responses don't have date information
// So we'll only sort by URN for trimmed responses
export function universalNewest(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  if (isTrimmedResponse(item1) || isTrimmedResponse(item2)) {
    // For trimmed responses, just sort by URN
    return getUrn(item1).localeCompare(getUrn(item2))
  }

  // For non-trimmed responses, use the original date sorting
  const date1: number = (item1 as any).maxTransferredAt || 0
  const date2: number = (item2 as any).maxTransferredAt || 0
  const result: number = date2 - date1
  if (result !== 0) {
    return result
  }

  return getUrn(item1).localeCompare(getUrn(item2))
}

export function universalOldest(item1: MixedWearableResponse, item2: MixedWearableResponse): number {
  if (isTrimmedResponse(item1) || isTrimmedResponse(item2)) {
    // For trimmed responses, just sort by URN
    return getUrn(item1).localeCompare(getUrn(item2))
  }

  // For non-trimmed responses, use the original date sorting
  const date1: number = (item1 as any).minTransferredAt || 0
  const date2: number = (item2 as any).minTransferredAt || 0
  const result: number = date1 - date2
  if (result !== 0) {
    return result
  }

  return getUrn(item1).localeCompare(getUrn(item2))
}

// Universal combined sorting function
export function createUniversalSorting(url: URL): SortingFunction<MixedWearableResponse> {
  const { sort, direction }: { sort: string; direction: string } = sortDirectionParams(url)

  if (sort === 'rarity' && direction === 'ASC') {
    return universalLeastRare
  } else if (sort === 'rarity' && direction === 'DESC') {
    return universalRarest
  } else if (sort === 'name' && direction === 'ASC') {
    return universalNameAZ
  } else if (sort === 'name' && direction === 'DESC') {
    return universalNameZA
  } else if (sort === 'date' && direction === 'ASC') {
    return universalOldest
  } else if (sort === 'date' && direction === 'DESC') {
    return universalNewest
  } else {
    throw new InvalidRequestError(
      `Invalid sorting requested: '${sort} ${direction}'. Valid options are '[rarity, name, date] [ASC, DESC]'.`
    )
  }
}
