import { WearableDefinition } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../adapters/definitions'
import { BASE_AVATARS_COLLECTION_ID, fetchBaseWearables } from '../../logic/fetch-elements/fetch-base-items'
import { fetchWearablesByFilters, ItemsByFiltersCriteria } from '../../logic/fetch-elements/fetch-items-by-filters'
import { buildNextQuery, paginateCatalogResults, parseCatalogQuery } from '../../logic/items-catalog'
import { BaseWearable, HandlerContextWithPath } from '../../types'

type WearablesCatalogResponse = {
  wearables: WearableDefinition[]
  filters: ItemsByFiltersCriteria
  pagination: {
    limit: number
    lastId: string | undefined
    next: string | undefined
  }
}

export async function wearablesCatalogHandler(
  context: HandlerContextWithPath<
    'theGraph' | 'wearableDefinitionsFetcher' | 'entitiesFetcher' | 'contentServerUrl',
    '/collections/wearables'
  >
): Promise<{ status: 200; body: WearablesCatalogResponse }> {
  const { theGraph, wearableDefinitionsFetcher, entitiesFetcher, contentServerUrl } = context.components
  const { filters, limit, lastId } = parseCatalogQuery(context.url.searchParams, 'wearableId')

  const onlyBaseCollection =
    filters.collectionIds?.length === 1 && filters.collectionIds[0] === BASE_AVATARS_COLLECTION_ID
  const baseCollectionAllowed = !filters.collectionIds || filters.collectionIds.includes(BASE_AVATARS_COLLECTION_ID)

  let offChain: WearableDefinition[] = []
  let onChainCursor = lastId
  if (baseCollectionAllowed && (!lastId || lastId.startsWith(BASE_AVATARS_COLLECTION_ID))) {
    const base = await fetchBaseWearables({ entitiesFetcher })
    offChain = filterAndExtractBaseWearables({ contentServerUrl }, base, filters, lastId)
    onChainCursor = undefined
  }

  const remaining = limit - offChain.length
  let onChainDefinitions: (WearableDefinition | undefined)[] = []
  if (!onlyBaseCollection && remaining >= 0) {
    const urns = await fetchWearablesByFilters(theGraph, filters, { limit: remaining + 1, lastId: onChainCursor })
    if (urns.length > 0) {
      onChainDefinitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(urns)
    }
  }

  const { items, nextLastId } = paginateCatalogResults(offChain, onChainDefinitions, limit)

  return {
    status: 200,
    body: {
      wearables: items,
      filters,
      pagination: {
        limit,
        lastId,
        next: nextLastId ? '?' + buildNextQuery(filters, limit, nextLastId, 'wearableId') : undefined
      }
    }
  }
}

type WearableEntityMetadata = {
  i18n?: { code: string; text: string }[]
  name?: string
}

function filterAndExtractBaseWearables(
  components: { contentServerUrl: string },
  baseWearables: BaseWearable[],
  filters: ItemsByFiltersCriteria,
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
        const metadata = wearable.entity.metadata as WearableEntityMetadata
        const englishName = metadata?.i18n?.find((entry) => entry.code === 'en')?.text
        const haystack = (englishName ?? wearable.name).toLowerCase()
        if (!haystack.includes(filters.textSearch)) {
          return false
        }
      }
      return true
    })
    .map((wearable) => extractWearableDefinitionFromEntity(components, wearable.entity))
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
}
