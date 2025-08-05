import { Entity, WearableDefinition } from '@dcl/schemas'
import { paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, InvalidRequestError, OnChainWearable, OnChainWearableResponse } from '../../types'
import { GetWearables200 } from '@dcl/catalyst-api-specs/lib/client'
import { ElementsFilters } from '../../adapters/elements-fetcher'

function mapItemToItemResponse(
  item: OnChainWearable,
  definition: WearableDefinition | undefined,
  entity: Entity | undefined
): OnChainWearableResponse {
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
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filters = extractFiltersFromURL(context.url)

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  // Use direct pagination from marketplace API with filters
  const { elements, totalAmount } = await wearablesFetcher.fetchOwnedElements(address, pagination, filters)
  const page = {
    elements,
    totalAmount,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  }

  const results: OnChainWearableResponse[] = []
  const wearables = page.elements
  const definitions: (WearableDefinition | undefined)[] = includeDefinitions
    ? await wearableDefinitionsFetcher.fetchItemsDefinitions(wearables.map((wearable) => wearable.urn))
    : []

  const entities: (Entity | undefined)[] = includeEntities
    ? await entitiesFetcher.fetchEntities(wearables.map((wearable) => wearable.urn))
    : []

  for (let i = 0; i < wearables.length; ++i) {
    const result = mapItemToItemResponse(
      wearables[i],
      includeDefinitions ? definitions[i] : undefined,
      includeEntities ? entities[i] : undefined
    )
    results.push(result)
  }

  return {
    status: 200,
    body: {
      ...page,
      elements: results
    }
  }
}
