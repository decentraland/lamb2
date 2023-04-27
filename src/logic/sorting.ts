import { RARITIES } from './utils'

const byUrn: SortingFunction<HasUrn> = (item1: HasUrn, item2: HasUrn): number => item1.urn.localeCompare(item2.urn)

export type HasUrn = { urn: string }
export type HasName = { name: string } & HasUrn
export type HasRarity = { rarity: string } & HasUrn
export type HasDate = { minTransferredAt: number; maxTransferredAt: number } & HasUrn

function compareByRarity(item1: HasRarity, item2: HasRarity) {
  const w1RarityValue = RARITIES.findIndex((rarity) => rarity === item1.rarity)
  const w2RarityValue = RARITIES.findIndex((rarity) => rarity === item2.rarity)
  return w2RarityValue - w1RarityValue
}

export const nameAZ: SortingFunction<HasName> = (item1: HasName, item2: HasName): number => {
  return item1.name.localeCompare(item2.name) || byUrn(item1, item2)
}

export const nameZA: SortingFunction<HasName> = (item1: HasName, item2: HasName): number => {
  return item2.name.localeCompare(item1.name) || byUrn(item1, item2)
}

export const rarest: SortingFunction<HasRarity> = (item1: HasRarity, item2: HasRarity): number => {
  return compareByRarity(item1, item2) || byUrn(item1, item2)
}

export const leastRare: SortingFunction<HasRarity> = (item1: HasRarity, item2: HasRarity): number => {
  return compareByRarity(item2, item1) || byUrn(item1, item2)
}

export const newest: SortingFunction<HasDate> = (item1: HasDate, item2: HasDate): number => {
  return item2.maxTransferredAt - item1.maxTransferredAt || byUrn(item1, item2)
}

export const oldest: SortingFunction<HasDate> = (item1: HasDate, item2: HasDate): number => {
  return item1.minTransferredAt - item2.minTransferredAt || byUrn(item2, item1)
}

export type SortingFunction<T> = (item1: T, item2: T) => number

function hasRarity(item: Partial<HasRarity>): item is HasRarity {
  return !!item.rarity
}

export const rarestOptional: SortingFunction<HasUrn & Partial<HasRarity>> = (
  item1: HasUrn & Partial<HasRarity>,
  item2: HasUrn & Partial<HasRarity>
): number => {
  if (hasRarity(item1) && hasRarity(item2)) {
    return compareByRarity(item1, item2) || byUrn(item1, item2)
  } else if (!hasRarity(item1) && !hasRarity(item2)) {
    return byUrn(item1, item2)
  } else if (hasRarity(item1)) {
    return 1
  } else {
    return -1
  }
}

export const leastRareOptional: SortingFunction<HasUrn & Partial<HasRarity>> = (
  item1: HasUrn & Partial<HasRarity>,
  item2: HasUrn & Partial<HasRarity>
): number => {
  return -rarestOptional(item1, item2)
}

function hasDate(item: Partial<HasDate>): item is HasDate {
  return !!item.maxTransferredAt && !!item.minTransferredAt
}

export const newestOptional: SortingFunction<HasUrn & Partial<HasDate>> = (
  item1: HasUrn & Partial<HasDate>,
  item2: HasUrn & Partial<HasDate>
): number => {
  if (hasDate(item1) && hasDate(item2)) {
    return item2.maxTransferredAt - item1.maxTransferredAt || byUrn(item1, item2)
  } else if (!hasDate(item1) && !hasDate(item2)) {
    return byUrn(item1, item2)
  } else if (hasDate(item1)) {
    return 1
  } else {
    return -1
  }
}

export const oldestOptional: SortingFunction<HasUrn & Partial<HasDate>> = (
  item1: HasUrn & Partial<HasDate>,
  item2: HasUrn & Partial<HasDate>
): number => {
  if (hasDate(item1) && hasDate(item2)) {
    return item1.minTransferredAt - item2.minTransferredAt || byUrn(item2, item1)
  } else if (!hasDate(item1) && !hasDate(item2)) {
    return byUrn(item1, item2)
  } else if (hasDate(item1)) {
    return 1
  } else {
    return -1
  }
}

export function createSorting<T extends HasName & HasRarity & HasDate>(url: URL): SortingFunction<T> {
  const sort = url.searchParams.has('orderBy') ? url.searchParams.get('orderBy')!.toLowerCase() : 'rarest'
  const direction = url.searchParams.has('direction') ? url.searchParams.get('direction')!.toUpperCase() : 'ASC'

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
    return rarest
  }
}

export function createBaseSorting<T extends HasName>(url: URL): SortingFunction<T> {
  const sort = url.searchParams.has('orderBy') ? url.searchParams.get('orderBy')!.toLowerCase() : 'name'
  const direction = url.searchParams.has('direction') ? url.searchParams.get('direction')!.toUpperCase() : 'ASC'

  if (sort === 'name' && direction === 'ASC') {
    return nameAZ
  } else if (sort === 'name' && direction === 'DESC') {
    return nameZA
  } else {
    throw new Error(`Invalid sorting: ${sort} ${direction}`)
  }
}

export function createCombinedSorting<T extends HasName>(url: URL): SortingFunction<T> {
  const sort = url.searchParams.has('orderBy') ? url.searchParams.get('orderBy')!.toLowerCase() : 'rarest'
  const direction = url.searchParams.has('direction') ? url.searchParams.get('direction')!.toUpperCase() : 'ASC'

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
    return rarestOptional
  }
}
