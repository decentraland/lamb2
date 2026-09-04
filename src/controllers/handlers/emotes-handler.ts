import { HandlerContextWithPath, InvalidRequestError, OnChainEmote, OnChainEmoteResponse } from '../../types'
import { GetEmotes200 } from '@dcl/catalyst-api-specs/lib/client'
import { createPaginationAndFilters, mapItemToResponse, fetchDefinitionsAndEntities } from './utils'
import { PAGINATION_DEFAULTS } from '../../logic/pagination-constants'

function mapEmoteToItemResponse(item: OnChainEmote): Omit<OnChainEmoteResponse, 'definition' | 'entity'> {
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
    rarity: item.rarity
  }
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

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  // Extract pagination and filters (includes sorting validation)
  const { pagination, filters } = createPaginationAndFilters(context.url, PAGINATION_DEFAULTS.MAX_PAGE_SIZE)

  // Fetch elements (fetcher handles caching transparently)
  const { elements, totalAmount } = await emotesFetcher.fetchOwnedElements(address, pagination, filters)

  // Fetch definitions and entities if requested
  const { definitions, entities } = await fetchDefinitionsAndEntities(
    elements,
    includeDefinitions,
    includeEntities,
    emoteDefinitionsFetcher,
    entitiesFetcher
  )

  // Map results
  const results: OnChainEmoteResponse[] = elements.map((emote, i) =>
    mapItemToResponse(
      emote,
      includeDefinitions ? definitions[i] : undefined,
      includeEntities ? entities[i] : undefined,
      mapEmoteToItemResponse
    )
  )

  return {
    status: 200,
    body: {
      elements: results,
      totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}
