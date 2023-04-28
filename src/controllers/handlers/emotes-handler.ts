import { EmoteDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createSorting } from '../../logic/sorting'
import { ErrorResponse, HandlerContextWithPath, OnChainEmote, PaginatedResponse } from '../../types'
import { createFilters } from './items-commons'

// TODO: change this name
type ItemResponse = OnChainEmote & {
  definition?: EmoteDefinition
}

function mapItemToItemResponse(item: OnChainEmote, definitions: EmoteDefinition | undefined): ItemResponse {
  return {
    urn: item.urn,
    amount: item.individualData.length,
    individualData: item.individualData,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    definition: definitions
  } as ItemResponse
} // TODO Remove forced cast

export async function emotesHandler(
  context: HandlerContextWithPath<'emotesFetcher' | 'emoteDefinitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { emoteDefinitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createSorting(context.url)

  const page = await fetchAndPaginate<OnChainEmote>(
    address,
    emotesFetcher.fetchOwnedElements,
    pagination,
    filter,
    sorting
  )

  const results: ItemResponse[] = []
  const emotes = page.elements
  const definitions = includeDefinitions
    ? await emoteDefinitionsFetcher.fetchItemsDefinitions(emotes.map((emote) => emote.urn))
    : []

  for (let i = 0; i < emotes.length; ++i) {
    results.push(mapItemToItemResponse(emotes[i], includeDefinitions ? definitions[i] : undefined))
  }

  return {
    status: 200,
    body: {
      ...page,
      elements: results
    }
  }
}
