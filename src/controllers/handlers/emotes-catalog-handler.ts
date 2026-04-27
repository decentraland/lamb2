import { EmoteDefinition } from '@dcl/schemas'
import { fetchEmotesByFilters, ItemsByFiltersCriteria } from '../../logic/fetch-elements/fetch-items-by-filters'
import { buildNextQuery, paginateCatalogResults, parseCatalogQuery } from '../../logic/items-catalog'
import { HandlerContextWithPath } from '../../types'

type EmotesCatalogResponse = {
  emotes: EmoteDefinition[]
  filters: ItemsByFiltersCriteria
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
  const { filters, limit, lastId } = parseCatalogQuery(context.url.searchParams, 'emoteId')

  const urns = await fetchEmotesByFilters(theGraph, filters, { limit: limit + 1, lastId })
  const definitions = urns.length > 0 ? await emoteDefinitionsFetcher.fetchItemsDefinitions(urns) : []

  const { items, nextLastId } = paginateCatalogResults<EmoteDefinition>([], definitions, limit)

  return {
    status: 200,
    body: {
      emotes: items,
      filters,
      pagination: {
        limit,
        lastId,
        next: nextLastId ? '?' + buildNextQuery(filters, limit, nextLastId, 'emoteId') : undefined
      }
    }
  }
}
