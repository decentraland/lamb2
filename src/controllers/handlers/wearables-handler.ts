import { Entity, WearableDefinition } from '@dcl/schemas'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createSorting } from '../../logic/sorting'
import { HandlerContextWithPath, InvalidRequestError, OnChainWearable, OnChainWearableResponse } from '../../types'
import { createFilters } from './items-commons'
import { GetWearables200 } from '@dcl/catalyst-api-specs/lib/client'

function mapItemToItemResponse(
  item: OnChainWearable,
  definition: WearableDefinition | undefined,
  entity: Entity | undefined
): OnChainWearableResponse {
  return {
    urn: item.urn,
    amount: item.individualData.length,
    individualData: item.individualData,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    definition,
    entity
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
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filter = createFilters(context.url)
  const sorting = createSorting(context.url)

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  const page = await fetchAndPaginate<OnChainWearable>(
    () => wearablesFetcher.fetchOwnedElements(address),
    pagination,
    filter,
    sorting
  )

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
