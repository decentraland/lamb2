import { WearableDefinition } from '@dcl/schemas'
import { fetchBaseWearables } from '../../logic/fetch-elements/fetch-base-items'
import {
  fetchWearablesByFilters,
  WearablesByFiltersCriteria
} from '../../logic/fetch-elements/fetch-wearables-by-filters'
import { BaseWearable, HandlerContextWithPath, InvalidRequestError } from '../../types'

const MAX_LIMIT = 500
const BASE_AVATARS_COLLECTION_ID = 'urn:decentraland:off-chain:base-avatars'

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
  const { theGraph, wearableDefinitionsFetcher, entitiesFetcher } = context.components
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
  const filters: WearablesByFiltersCriteria = {
    collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
    itemIds: wearableIds.length > 0 ? wearableIds : undefined,
    textSearch
  }

  let remaining = limit
  let onChainCursor = lastId

  const onlyBaseCollection =
    filters.collectionIds?.length === 1 && filters.collectionIds[0] === BASE_AVATARS_COLLECTION_ID
  const baseCollectionAllowed = !filters.collectionIds || filters.collectionIds.includes(BASE_AVATARS_COLLECTION_ID)

  let offChain: WearableDefinition[] = []
  if (baseCollectionAllowed && (!lastId || lastId.startsWith(BASE_AVATARS_COLLECTION_ID))) {
    const base = await fetchBaseWearables({ entitiesFetcher })
    offChain = filterBaseWearables(base, filters, lastId)
    remaining -= offChain.length
    onChainCursor = undefined
  }

  let onChain: WearableDefinition[] = []
  if (!onlyBaseCollection && remaining >= 0) {
    const urns = await fetchWearablesByFilters(theGraph, filters, { limit: remaining + 1, lastId: onChainCursor })
    if (urns.length > 0) {
      const definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(urns)
      onChain = definitions
        .filter((d): d is WearableDefinition => !!d)
        .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
    }
  }

  const merged = [...offChain, ...onChain]
  const hasMore = merged.length > limit
  const slice = hasMore ? merged.slice(0, limit) : merged
  const nextLastId = hasMore ? slice[slice.length - 1]?.id : undefined

  return {
    status: 200,
    body: {
      wearables: slice,
      filters,
      pagination: {
        limit,
        lastId,
        next: nextLastId ? '?' + buildNextQuery(filters, limit, nextLastId) : undefined
      }
    }
  }
}

function filterBaseWearables(
  baseWearables: BaseWearable[],
  filters: WearablesByFiltersCriteria,
  lastId: string | undefined
): WearableDefinition[] {
  return baseWearables
    .filter((wearable) => {
      const lcUrn = wearable.urn.toLowerCase()
      if (lastId && lcUrn <= lastId) {
        return false
      }
      if (filters.itemIds && !filters.itemIds.includes(lcUrn)) {
        return false
      }
      if (filters.textSearch) {
        const englishName = (wearable.entity.metadata as { i18n?: { code: string; text: string }[] })?.i18n?.find(
          (entry) => entry.code === 'en'
        )?.text
        const haystack = (englishName ?? wearable.name).toLowerCase()
        if (!haystack.includes(filters.textSearch)) {
          return false
        }
      }
      return true
    })
    .map((wearable) => wearable.entity.metadata as WearableDefinition)
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
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

function buildNextQuery(filters: WearablesByFiltersCriteria, limit: number, nextLastId: string): string {
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
