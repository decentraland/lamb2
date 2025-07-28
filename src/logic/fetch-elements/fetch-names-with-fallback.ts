import { AppComponents, Name } from '../../types'
import { fetchAllNames as fetchAllNamesFromGraph } from './fetch-names'
import { PaginatedElementsResult } from '../../adapters/elements-fetcher'

/**
 * Fetches names for a user with fallback logic:
 * 1. Try marketplace-api first
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchNamesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit?: number,
  offset?: number
): Promise<PaginatedElementsResult<Name>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-names-with-fallback')

  try {
    logger.debug('Attempting to fetch names from marketplace-api', { owner, limit: limit || 100, offset: offset || 0 })
    const result = await marketplaceApiFetcher.getNamesByOwner(owner, limit || 100, offset || 0)
    logger.debug('Successfully fetched names from marketplace-api', {
      owner,
      limit: limit || 100,
      offset: offset || 0,
      returned: result.data.length,
      total: result.total
    })
    return {
      elements: result.data,
      totalAmount: result.total
    }
  } catch (error) {
    logger.warn('Failed to fetch names from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const allNames = await fetchAllNamesFromGraph({ theGraph }, owner)
      const actualLimit = limit || allNames.length
      const actualOffset = offset || 0
      const elements = allNames.slice(actualOffset, actualOffset + actualLimit)
      logger.debug('Successfully fetched names from TheGraph fallback', {
        owner,
        limit: actualLimit,
        offset: actualOffset,
        returned: elements.length,
        total: allNames.length
      })
      return {
        elements,
        totalAmount: allNames.length
      }
    } catch (fallbackError) {
      logger.error('Failed to fetch names from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}

/**
 * Fetches ALL names for a user (used only for profiles that need complete ownership data)
 * Makes multiple paginated calls to get every single name owned by the user
 */
export async function fetchAllNamesForProfile(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<Name[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-all-names-for-profile')

  try {
    logger.debug('Attempting to fetch ALL names from marketplace-api for profile', { owner })
    const result = await marketplaceApiFetcher.getAllNamesByOwner(owner)
    logger.debug('Successfully fetched ALL names from marketplace-api for profile', {
      owner,
      count: result.length
    })
    return result
  } catch (error) {
    logger.warn('Failed to fetch ALL names from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const result = await fetchAllNamesFromGraph({ theGraph }, owner)
      logger.debug('Successfully fetched ALL names from TheGraph fallback for profile', {
        owner,
        count: result.length
      })
      return result
    } catch (fallbackError) {
      logger.error('Failed to fetch ALL names from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}
