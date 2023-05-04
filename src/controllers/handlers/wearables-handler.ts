import { WearableDefinition } from '@dcl/schemas'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createSorting } from '../../logic/sorting'
import {
  ErrorResponse,
  HandlerContextWithPath,
  OnChainWearable,
  OnChainWearableResponse,
  PaginatedResponse
} from '../../types'
import { createFilters } from './items-commons'

function mapItemToItemResponse(
  item: OnChainWearable,
  definitions: WearableDefinition | undefined
): OnChainWearableResponse {
  return {
    urn: item.urn,
    amount: item.individualData.length,
    individualData: item.individualData,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    definition: definitions
  }
}

export async function wearablesHandler(
  context: HandlerContextWithPath<'wearablesFetcher' | 'wearableDefinitionsFetcher', '/users/:address/wearables'>
): Promise<PaginatedResponse<OnChainWearableResponse> | ErrorResponse> {
  const { wearableDefinitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filter = createFilters(context.url)
  const sorting = createSorting(context.url)

  const page = await fetchAndPaginate<OnChainWearable>(
    address,
    wearablesFetcher.fetchOwnedElements,
    pagination,
    filter,
    sorting
  )

  const results: OnChainWearableResponse[] = []
  const wearables = page.elements
  const definitions: (WearableDefinition | undefined)[] = includeDefinitions
    ? await wearableDefinitionsFetcher.fetchItemsDefinitions(wearables.map((wearable) => wearable.urn))
    : []

  for (let i = 0; i < wearables.length; ++i) {
    results.push(mapItemToItemResponse(wearables[i], includeDefinitions ? definitions[i] : undefined))
  }

  return {
    status: 200,
    body: {
      ...page,
      elements: results
    }
  }
}
