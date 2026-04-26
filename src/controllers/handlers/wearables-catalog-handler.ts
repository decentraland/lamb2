import { WearableDefinition } from '@dcl/schemas'
import { CatalogFilters, getWearablesCatalog } from '../../logic/wearables-catalog'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

const MAX_LIMIT = 500

type WearablesCatalogResponse = {
  wearables: WearableDefinition[]
  filters: {
    collectionIds?: string[]
    itemIds?: string[]
    textSearch?: string
  }
  pagination: {
    limit: number
    lastId: string | undefined
    next: string | undefined
  }
}

export async function wearablesCatalogHandler(
  context: HandlerContextWithPath<
    'theGraph' | 'wearableDefinitionsFetcher' | 'entitiesFetcher',
    '/collections/wearables'
  >
): Promise<{ status: 200; body: WearablesCatalogResponse }> {
  const { searchParams } = context.url

  const collectionIds = searchParams.getAll('collectionId').map((id) => id.toLowerCase())
  const wearableIds = searchParams.getAll('wearableId').map((id) => id.toLowerCase())
  const textSearch = searchParams.get('textSearch')?.toLowerCase() || undefined
  const lastId = searchParams.get('lastId')?.toLowerCase() || undefined

  if (collectionIds.length === 0 && wearableIds.length === 0 && !textSearch) {
    throw new InvalidRequestError(`You must use one of the filters: 'textSearch', 'collectionId' or 'wearableId'`)
  }
  if (textSearch && textSearch.length < 3) {
    throw new InvalidRequestError('The text search must be at least 3 characters long')
  }
  if (wearableIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't ask for more than ${MAX_LIMIT} wearables`)
  }
  if (collectionIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't filter for more than ${MAX_LIMIT} collection ids`)
  }

  const limit = clampLimit(searchParams.get('limit'))

  const filters: CatalogFilters = {
    collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
    itemIds: wearableIds.length > 0 ? wearableIds : undefined,
    textSearch
  }

  const { wearables, lastId: nextLastId } = await getWearablesCatalog(context.components, filters, { limit, lastId })

  return {
    status: 200,
    body: {
      wearables,
      filters,
      pagination: {
        limit,
        lastId,
        next: nextLastId ? '?' + buildNextQuery(filters, limit, nextLastId) : undefined
      }
    }
  }
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

function buildNextQuery(filters: CatalogFilters, limit: number, nextLastId: string): string {
  const params = new URLSearchParams()
  if (filters.collectionIds) {
    for (const id of filters.collectionIds) {
      params.append('collectionId', id)
    }
  }
  if (filters.itemIds) {
    for (const id of filters.itemIds) {
      params.append('wearableId', id)
    }
  }
  if (filters.textSearch) {
    params.set('textSearch', filters.textSearch)
  }
  params.set('limit', limit.toString())
  params.set('lastId', nextLastId)
  return params.toString()
}
