import { EmoteDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse } from '../../types'
import { compareByRarity } from '../../logic/utils'

// TODO: change this name
type ItemResponse = Item & {
  definition?: EmoteDefinition
}

export async function emotesHandler(
  context: HandlerContextWithPath<'logs' | 'emotesFetcher' | 'emoteDefinitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, emoteDefinitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('emotes-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const page = await fetchAndPaginate<ItemResponse>(
      address,
      emotesFetcher.fetchOwnedElements,
      pagination,
      undefined,
      compareByRarity
    )

    if (includeDefinitions) {
      const emotes = page.elements
      const definitions = await emoteDefinitionsFetcher.fetchItemsDefinitions(emotes.map((emote) => emote.urn))
      const results: ItemResponse[] = []
      for (let i = 0; i < emotes.length; ++i) {
        results.push({
          ...emotes[i],
          definition: includeDefinitions ? definitions[i] : undefined
        })
      }
      page.elements = results
    }

    return {
      status: 200,
      body: {
        ...page
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
