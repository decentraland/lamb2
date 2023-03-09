import { ThirdPartyFetcherError, ThirdPartyFetcherErrorCode } from '../../adapters/third-party-wearables-fetcher'
import { WearablesFetcherError, WearablesFetcherErrorCode } from '../../adapters/wearables-fetcher'
import { parseUrn, paginationObject } from '../../logic/utils'
import {
  Definition,
  ErrorResponse,
  HandlerContextWithPath,
  PaginatedResponse,
  ThirdPartyWearable,
  Wearable
} from '../../types'

// TODO: change this name
type WearableResponse = Pick<Wearable, 'urn' | 'amount' | 'individualData' | 'rarity'> & {
  definition?: Definition
}

export async function wearablesHandler(
  context: HandlerContextWithPath<'logs' | 'wearablesFetcher' | 'definitionsFetcher', '/users/:address/wearables'>
): Promise<PaginatedResponse<WearableResponse> | ErrorResponse> {
  const { logs, definitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, wearables } = await wearablesFetcher.fetchByOwner(address, pagination)

    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(wearables.map((w) => w.urn))
      : []

    const results: WearableResponse[] = []
    for (let i = 0; i < wearables.length; ++i) {
      const { urn, amount, individualData, rarity } = wearables[i]
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
    if (err instanceof WearablesFetcherError) {
      switch (err.code) {
        case WearablesFetcherErrorCode.CANNOT_FETCH_WEARABLES: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch wearables right now'
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

// TODO: change this name
type ThirdPartyWearableResponse = Pick<ThirdPartyWearable, 'urn' | 'amount' | 'individualData'> & {
  definition?: Definition
}

export async function thirdPartyWearablesHandler(
  context: HandlerContextWithPath<
    'thirdPartyWearablesFetcher' | 'definitionsFetcher' | 'logs',
    '/users/:address/third-party-wearables'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { thirdPartyWearablesFetcher, definitionsFetcher, logs } = context.components
  const { address } = context.params
  const logger = logs.getLogger('third-party-wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const { totalAmount, wearables } = await thirdPartyWearablesFetcher.fetchByOwner(address, pagination)

    const results: ThirdPartyWearableResponse[] = wearables
    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(wearables.map((w) => w.urn))
      : []

    for (let i = 0; i < wearables.length; ++i) {
      const { urn, amount, individualData } = wearables[i]
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

export async function thirdPartyCollectionWearablesHandler(
  context: HandlerContextWithPath<
    'thirdPartyWearablesFetcher' | 'definitionsFetcher' | 'logs',
    '/users/:address/third-party-wearables/:collectionId'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { thirdPartyWearablesFetcher, definitionsFetcher, logs } = context.components
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
    const { totalAmount, wearables } = await thirdPartyWearablesFetcher.fetchCollectionByOwner(address, urn, pagination)

    const results: ThirdPartyWearableResponse[] = wearables
    const definitions = includeDefinitions
      ? await definitionsFetcher.fetchWearablesDefinitions(wearables.map((w) => w.urn))
      : []

    for (let i = 0; i < wearables.length; ++i) {
      const { urn, amount, individualData } = wearables[i]
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
