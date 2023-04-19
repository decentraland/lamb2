import { EmoteDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse, WearableDefinition } from '../../types'
import { compareByRarity } from '../../logic/utils'

// TODO: change this name
type ItemResponse = Item & {
  definition?: EmoteDefinition
}

const mapItemToItemResponse = (item: Item, definitions: EmoteDefinition | undefined): ItemResponse =>
  ({
    urn: item.urn,
    amount: item.individualData.length,
    individualData: item.individualData,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    definition: definitions
  } as ItemResponse) // TODO Remove forced cast

export async function emotesHandler(
  context: HandlerContextWithPath<'logs' | 'emotesFetcher' | 'emoteDefinitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, emoteDefinitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('emotes-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const page = await fetchAndPaginate<Item>(
      address,
      emotesFetcher.fetchOwnedElements,
      pagination,
      undefined,
      compareByRarity
    )

    const results: ItemResponse[] = []
    const emotes = page.elements
    if (includeDefinitions) {
      const definitions = includeDefinitions
        ? await emoteDefinitionsFetcher.fetchItemsDefinitions(emotes.map((emote) => emote.urn))
        : []

      for (let i = 0; i < emotes.length; ++i) {
        results.push(mapItemToItemResponse(emotes[i], includeDefinitions ? definitions[i] : undefined))
      }
      page.elements = results
    }

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  } catch (err: any) {
    if (err instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch emotes right now'
        }
      }
    }
    logger.error(err)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}
