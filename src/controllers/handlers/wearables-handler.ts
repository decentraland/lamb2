import { FetcherError, FetcherErrorCode } from '../../adapters/elements-fetcher'
import { fetchAllThirdPartyWearablesCollection } from '../../logic/fetch-nfts'
import { parseUrn, paginationObject } from '../../logic/utils'
import {
  Definition,
  ErrorResponse,
  HandlerContextWithPath,
  Item,
  PaginatedResponse,
  ThirdPartyFetcherError,
  ThirdPartyFetcherErrorCode,
  ThirdPartyWearable
} from '../../types'

// TODO: change this name
type ItemResponse = Pick<Item, 'urn' | 'amount' | 'individualData' | 'rarity'> & {
  definition?: Definition
}

export async function wearablesHandler(
  context: HandlerContextWithPath<'logs' | 'wearablesFetcher' | 'definitionsFetcher', '/users/:address/wearables'>
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, elements } = await wearablesFetcher.fetchByOwner(address, pagination)

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(elements.map((element) => element.urn))
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
              error: 'Cannot fetch wearables right now'
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

// TODO: change this name
type ThirdPartyWearableResponse = Pick<ThirdPartyWearable, 'urn' | 'amount' | 'individualData'> & {
  definition?: Definition
}

export async function thirdPartyWearablesHandler(
  context: HandlerContextWithPath<
    'definitionsFetcher' | 'logs' | 'thirdPartyWearablesFetcher',
    '/users/:address/third-party-wearables'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { definitionsFetcher, logs, thirdPartyWearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('third-party-wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, elements } = await thirdPartyWearablesFetcher.fetchByOwner(address, pagination)

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(elements.map((w) => w.urn))
      : []

    const results: ThirdPartyWearableResponse[] = []
    for (let i = 0; i < elements.length; ++i) {
      const { urn, amount, individualData } = elements[i]
      results.push({
        urn,
        amount,
        individualData,
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
              error: 'Cannot fetch third parties right now'
            }
          }
        }
        // case ThirdPartyFetcherErrorCode.THIRD_PARTY_NOT_FOUND: {
        //   return {
        //     status: 502,
        //     body: {
        //       error: 'Cannot fetch third parties right now'
        //     }
        //   }
        // }
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

export async function thirdPartyCollectionWearablesHandler(
  context: HandlerContextWithPath<
    'definitionsFetcher' | 'logs' | 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersFetcher' | 'theGraph' | 'fetch',
    '/users/:address/third-party-wearables/:collectionId'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { definitionsFetcher, logs } = context.components
  const logger = logs.getLogger('third-party-collections-handler')
  const { address, collectionId } = context.params

  const urn = await parseUrn(collectionId)
  if (!urn) {
    return {
      status: 400,
      body: {
        error: 'Invalid collection id: not a valid URN'
      }
    }
  }

  if (urn.type !== 'blockchain-collection-third-party-collection') {
    return {
      status: 400,
      body: {
        error: 'Invalid collection id: not a blockchain-collection-third-party-collection URN'
      }
    }
  }

  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, elements } = await fetchAllThirdPartyWearablesCollection(
      context.components,
      address,
      urn,
      pagination
    )

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(elements.map((w) => w.urn))
      : []

    const results: ThirdPartyWearableResponse[] = []
    for (let i = 0; i < elements.length; ++i) {
      const { urn, amount, individualData } = elements[i]
      results.push({
        urn,
        amount,
        individualData,
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
    if (err instanceof ThirdPartyFetcherError) {
      switch (err.code) {
        case ThirdPartyFetcherErrorCode.CANNOT_LOAD_THIRD_PARTY_WEARABLES: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch third parties right now'
            }
          }
        }
        case ThirdPartyFetcherErrorCode.THIRD_PARTY_NOT_FOUND: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch third parties right now'
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
