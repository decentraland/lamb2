import { EmoteDefinition } from '@dcl/schemas'
import { fetchEmotesByFilters, ItemsByFiltersCriteria } from '../../logic/fetch-elements/fetch-items-by-filters'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

const MAX_LIMIT = 500

type EmotesCatalogResponse = {
  emotes: EmoteDefinition[]
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

export async function emotesCatalogHandler(
  context: HandlerContextWithPath<'theGraph' | 'emoteDefinitionsFetcher', '/collections/emotes'>
): Promise<{ status: 200; body: EmotesCatalogResponse }> {
  const { theGraph, emoteDefinitionsFetcher } = context.components
  const { searchParams } = context.url

  const collectionIds = searchParams.getAll('collectionId').map((id) => id.toLowerCase())
  const emoteIds = searchParams.getAll('emoteId').map((id) => id.toLowerCase())
  const textSearch = searchParams.get('textSearch')?.toLowerCase() || undefined
  const lastId = searchParams.get('lastId')?.toLowerCase() || undefined

  if (collectionIds.length === 0 && emoteIds.length === 0 && !textSearch) {
    throw new InvalidRequestError(`You must use one of the filters: 'textSearch', 'collectionId' or 'emoteId'`)
  }
  if (textSearch && textSearch.length < 3) {
    throw new InvalidRequestError('The text search must be at least 3 characters long')
  }
  if (emoteIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't ask for more than ${MAX_LIMIT} emotes`)
  }
  if (collectionIds.length > MAX_LIMIT) {
    throw new InvalidRequestError(`You can't filter for more than ${MAX_LIMIT} collection ids`)
  }

  const limit = clampLimit(searchParams.get('limit'))
  const filters: ItemsByFiltersCriteria = {
    collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
    itemIds: emoteIds.length > 0 ? emoteIds : undefined,
    textSearch
  }

  const urns = await fetchEmotesByFilters(theGraph, filters, { limit: limit + 1, lastId })
  const definitions = urns.length > 0 ? await emoteDefinitionsFetcher.fetchItemsDefinitions(urns) : []
  const sorted = definitions
    .filter((d): d is EmoteDefinition => !!d)
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))

  const hasMore = sorted.length > limit
  const slice = hasMore ? sorted.slice(0, limit) : sorted
  const nextLastId = hasMore ? slice[slice.length - 1]?.id : undefined

  return {
    status: 200,
    body: {
      emotes: slice,
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

function buildNextQuery(filters: ItemsByFiltersCriteria, limit: number, nextLastId: string): string {
  const params = new URLSearchParams()
  if (filters.collectionIds) {
    for (const id of filters.collectionIds) {
      params.append('collectionId', id)
    }
  }
  if (filters.itemIds) {
    for (const id of filters.itemIds) {
      params.append('emoteId', id)
    }
  }
  if (filters.textSearch) {
    params.set('textSearch', filters.textSearch)
  }
  params.set('limit', limit.toString())
  params.set('lastId', nextLastId)
  return params.toString()
}
