import { FetcherError, FetcherErrorCode } from '../../adapters/elements-fetcher'
import { paginationObject } from '../../logic/utils'
import { Definition, ErrorResponse, HandlerContextWithPath, Item, PaginatedResponse } from '../../types'

// TODO: change this name
type ItemResponse = Pick<Item, 'urn' | 'amount' | 'individualData' | 'rarity'> & {
  definition?: Definition
}

export async function emotesHandler(
  context: HandlerContextWithPath<'logs' | 'emotesFetcher' | 'definitionsFetcher', '/users/:address/emotes'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, emotesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('emotes-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, elements } = await emotesFetcher.fetchByOwner(address, pagination)

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchEmotesDefinitions(elements.map((element) => element.urn))
      : []

    const results: ItemResponse[] = []
    for (let i = 0; i < elements.length; ++i) {
      const { urn, amount, individualData, rarity } = elements[i]
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
    if (err instanceof FetcherError) {
      switch (err.code) {
        case FetcherErrorCode.CANNOT_FETCH_ELEMENTS: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch emotes right now'
            }
          }
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
