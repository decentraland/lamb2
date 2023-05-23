import { EmoteDefinition, Entity } from '@dcl/schemas'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createSorting } from '../../logic/sorting'
import { HandlerContextWithPath, InvalidRequestError, OnChainEmote, OnChainEmoteResponse } from '../../types'
import { createFilters } from './items-commons'
import { GetEmotes200 } from '@dcl/catalyst-api-specs/lib/client'

function mapItemToItemResponse(
  item: OnChainEmote,
  definition: EmoteDefinition | undefined,
  entity: Entity | undefined
): OnChainEmoteResponse {
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
  const filter = createFilters(context.url)
  const sorting = createSorting(context.url)

  if (includeDefinitions && includeEntities) {
    throw new InvalidRequestError('Cannot use includeEntities and includeDefinitions together')
  }

  const page = await fetchAndPaginate<OnChainEmote>(
    () => emotesFetcher.fetchOwnedElements(address),
    pagination,
    filter,
    sorting
  )

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
