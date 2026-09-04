import { HandlerContextWithPath, InvalidRequestError, OnChainWearable, OnChainWearableResponse } from '../../types'
import { GetWearables200 } from '@dcl/catalyst-api-specs/lib/client'
import { createPaginationAndFilters, mapItemToResponse, fetchDefinitionsAndEntities } from './utils'
import { PAGINATION_DEFAULTS } from '../../logic/pagination-constants'

function mapWearableToItemResponse(item: OnChainWearable): Omit<OnChainWearableResponse, 'definition' | 'entity'> {
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

export async function wearablesHandler(
  context: HandlerContextWithPath<
    'wearablesFetcher' | 'entitiesFetcher' | 'wearableDefinitionsFetcher',
    '/users/:address/wearables'
  >
): Promise<{ status: 200; body: GetWearables200 }> {
  const { wearableDefinitionsFetcher, entitiesFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const includeEntities = context.url.searchParams.has('includeEntities')

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  // Extract pagination and filters (includes sorting validation)
  const { pagination, filters } = createPaginationAndFilters(context.url, PAGINATION_DEFAULTS.MAX_PAGE_SIZE)

  // Fetch elements (fetcher handles caching transparently)
  const { elements, totalAmount } = await wearablesFetcher.fetchOwnedElements(address, pagination, filters)

  // Fetch definitions and entities if requested
  const { definitions, entities } = await fetchDefinitionsAndEntities(
    elements,
    includeDefinitions,
    includeEntities,
    wearableDefinitionsFetcher,
    entitiesFetcher
  )

  // Map results
  const results: OnChainWearableResponse[] = elements.map((wearable, i) =>
    mapItemToResponse(
      wearable,
      includeDefinitions ? definitions[i] : undefined,
      includeEntities ? entities[i] : undefined,
      mapWearableToItemResponse
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
