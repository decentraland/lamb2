import { EmotesFetcherError, EmotesFetcherErrorCode } from '../../adapters/emotes-fetcher'
import { paginationObject } from '../../logic/utils'
import { Definition, Emote, ErrorResponse, HandlerContextWithPath, PaginatedResponse } from '../../types'

// TODO: change this name
type EmoteResponse = Pick<Emote, 'urn' | 'amount' | 'individualData' | 'rarity'> & {
  definition?: Definition
}

export async function emotesHandler(
  context: HandlerContextWithPath<'logs' | 'emotesFetcher' | 'definitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<EmoteResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('emotes-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, emotes } = await emotesFetcher.fetchByOwner(address, pagination)

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchEmotesDefinitions(emotes.map((w) => w.urn))
      : []

    const results: EmoteResponse[] = []
    for (let i = 0; i < emotes.length; ++i) {
      const { urn, amount, individualData, rarity } = emotes[i]
      results.push({
        urn,
        amount,
        individualData,
        rarity,
        definition: includeDefinitions ? definitions[i] : undefined
      })
    }

    return {
      status: 200,
      body: {
        elements: results,
        totalAmount: totalAmount,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      }
    }
  } catch (err: any) {
    if (err instanceof EmotesFetcherError) {
      switch (err.code) {
        case EmotesFetcherErrorCode.CANNOT_FETCH_EMOTES: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch emotes right now'
            }
          }
        }
      }
    } else {
      logger.error(err)
      return {
        status: 500,
        body: {
          error: 'Internal Server Error'
        }
      }
    }
  }
}
