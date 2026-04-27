import { ItemsByFiltersCriteria } from './fetch-elements/fetch-items-by-filters'
import { InvalidRequestError } from '../types'

const MAX_LIMIT = 500

export type CatalogIdParam = 'wearableId' | 'emoteId'

export type CatalogQuery = {
  filters: ItemsByFiltersCriteria
  limit: number
  lastId: string | undefined
}

export function parseCatalogQuery(searchParams: URLSearchParams, idParamName: CatalogIdParam): CatalogQuery {
  const collectionIds = searchParams.getAll('collectionId').map((id) => id.toLowerCase())
  const itemIds = searchParams.getAll(idParamName).map((id) => id.toLowerCase())
  const textSearch = searchParams.get('textSearch')?.toLowerCase() || undefined
  const lastId = searchParams.get('lastId')?.toLowerCase() || undefined

  if (collectionIds.length === 0 && itemIds.length === 0 && !textSearch) {
    throw new InvalidRequestError(`You must use one of the filters: 'textSearch', 'collectionId' or '${idParamName}'`)
  }
  if (textSearch && textSearch.length < 3) {
    throw new InvalidRequestError('The text search must be at least 3 characters long')
  }
  const itemsLabel = idParamName === 'wearableId' ? 'wearables' : 'emotes'
  if (itemIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't ask for more than ${MAX_LIMIT} ${itemsLabel}`)
  }
  if (collectionIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't filter for more than ${MAX_LIMIT} collection ids`)
  }

  return {
    filters: {
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
      itemIds: itemIds.length > 0 ? itemIds : undefined,
      textSearch
    },
    limit: clampLimit(searchParams.get('limit')),
    lastId
  }
}

export function paginateCatalogResults<T extends { id: string }>(
  preMerge: T[],
  // The graph query already orders by urn ascending, but the definitions fetcher
  // does not guarantee preserving that order, so we re-sort defensively.
  fetchedDefinitions: (T | undefined)[],
  limit: number
): { items: T[]; nextLastId: string | undefined } {
  const sorted = fetchedDefinitions
    .filter((d): d is T => !!d)
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
  // Off-chain results come first to match the legacy ordering contract (off-chain > on-chain),
  // even when their URNs would sort after on-chain ones globally.
  const merged = [...preMerge, ...sorted]
  const hasMore = merged.length > limit
  const items = hasMore ? merged.slice(0, limit) : merged
  return { items, nextLastId: hasMore ? items[items.length - 1]?.id : undefined }
}

export function buildNextQuery(
  filters: ItemsByFiltersCriteria,
  limit: number,
  nextLastId: string,
  idParamName: CatalogIdParam
): string {
  const params = new URLSearchParams()
  if (filters.collectionIds) {
    for (const id of filters.collectionIds) {
      params.append('collectionId', id)
    }
  }
  if (filters.itemIds) {
    for (const id of filters.itemIds) {
      params.append(idParamName, id)
    }
  }
  if (filters.textSearch) {
    params.set('textSearch', filters.textSearch)
  }
  params.set('limit', limit.toString())
  params.set('lastId', nextLastId)
  return params.toString()
}

function clampLimit(raw: string | null): number {
  if (!raw) {
    return MAX_LIMIT
  }
  const parsed = parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
    return MAX_LIMIT
  }
  return parsed
}
