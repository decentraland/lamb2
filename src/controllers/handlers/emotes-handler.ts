import { EmoteDefinition, Entity } from '@dcl/schemas'
import { paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, InvalidRequestError, OnChainEmote, OnChainEmoteResponse } from '../../types'
import { GetEmotes200 } from '@dcl/catalyst-api-specs/lib/client'
import { ElementsFilters } from '../../adapters/elements-fetcher'
import { createSorting } from '../../logic/sorting'

function mapItemToItemResponse(
  item: OnChainEmote,
  definition: EmoteDefinition | undefined,
  entity: Entity | undefined
): OnChainEmoteResponse {
  return {
    urn: item.urn,
    amount: item.individualData.length,
    individualData: item.individualData.map((data) => ({
      ...data,
      transferredAt: data.transferredAt.toString(), // Convert transferredAt to string for API compatibility
      price: data.price.toString() // Convert price to string for API compatibility
    })),
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    definition,
    entity
  }
}

function extractFiltersFromURL(url: URL): ElementsFilters {
  const filters: ElementsFilters = {}

  if (url.searchParams.has('category')) {
    filters.category = url.searchParams.get('category')!
  }
  if (url.searchParams.has('rarity')) {
    filters.rarity = url.searchParams.get('rarity')!
  }
  if (url.searchParams.has('name')) {
    filters.name = url.searchParams.get('name')!
  }
  if (url.searchParams.has('orderBy')) {
    filters.orderBy = url.searchParams.get('orderBy')!
  }
  if (url.searchParams.has('direction')) {
    filters.direction = url.searchParams.get('direction')!
  }

  return filters
}

export async function emotesHandler(
  context: HandlerContextWithPath<
    'emotesFetcher' | 'entitiesFetcher' | 'emoteDefinitionsFetcher',
    '/users/:address/emotes'
  >
): Promise<{ status: 200; body: GetEmotes200 }> {
  const { emoteDefinitionsFetcher, emotesFetcher, entitiesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const includeEntities = context.url.searchParams.has('includeEntities')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filters = extractFiltersFromURL(context.url)

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  // Validate sorting parameters - this will throw InvalidRequestError if invalid
  if (context.url.searchParams.has('orderBy')) {
    createSorting(context.url)
  }

  // Use direct pagination from marketplace API with filters, but use cache when no explicit pagination or filters
  const hasExplicitPagination = context.url.searchParams.has('pageSize') || context.url.searchParams.has('pageNum')
  const hasFilters = Object.keys(filters).length > 0
  const { elements, totalAmount } =
    hasExplicitPagination || hasFilters
      ? await emotesFetcher.fetchOwnedElements(address, pagination, filters)
      : await emotesFetcher.fetchOwnedElements(address, undefined, undefined)
  const page = {
    elements,
    totalAmount, // Now using the real total from marketplace API! 🎉
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }

  const results: OnChainEmoteResponse[] = []
  const emotes = page.elements
  const definitions = includeDefinitions
    ? await emoteDefinitionsFetcher.fetchItemsDefinitions(emotes.map((emote) => emote.urn))
    : []

  const entities = includeEntities ? await entitiesFetcher.fetchEntities(emotes.map((emote) => emote.urn)) : []

  for (let i = 0; i < emotes.length; ++i) {
    results.push(
      mapItemToItemResponse(
        emotes[i],
        includeDefinitions ? definitions[i] : undefined,
        includeEntities ? entities[i] : undefined
      )
    )
  }

  return {
    status: 200,
    body: {
      ...page,
      elements: results
    }
  }
}
