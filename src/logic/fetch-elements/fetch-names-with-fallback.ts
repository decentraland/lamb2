import { AppComponents, Name } from '../../types'
import { fetchAllNames as fetchAllNamesFromGraph } from './fetch-names'
import { PaginatedElementsResult } from '../../adapters/elements-fetcher'
import { fetchNamesWithSmartPagination } from './smart-pagination-helper'

/**
 * Fetches all names for a user with fallback logic:
 * 1. Try marketplace-api first (with automatic pagination)
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchAllNamesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<Name[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-names-with-fallback')

  try {
    logger.debug('Attempting to fetch names from marketplace-api', { owner })
    const profileNames = await marketplaceApiFetcher.getAllNamesByOwner(owner)
    logger.debug('Successfully fetched names from marketplace-api', {
      owner,
      count: profileNames.length
    })
    return profileNames
  } catch (error) {
    logger.warn('Failed to fetch names from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const names = await fetchAllNamesFromGraph({ theGraph }, owner)
      logger.debug('Successfully fetched names from TheGraph fallback', {
        owner,
        count: names.length
      })
      return names
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
 * Fetches paginated names for a user with fallback logic:
 * 1. Try marketplace-api first (using direct pagination)
 * 2. If it fails, fallback to TheGraph (load all and paginate locally)
 */
export async function fetchNamesPaginatedWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit: number,
  offset: number
): Promise<PaginatedElementsResult<Name>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-names-paginated-with-fallback')

  try {
    logger.debug('Attempting to fetch paginated names using smart pagination', { owner, limit, offset })
    const result = await fetchNamesWithSmartPagination(marketplaceApiFetcher, owner, limit, offset, logger)
    logger.debug('Successfully fetched paginated names using smart pagination', {
      owner,
      limit,
      offset,
      returned: result.elements.length,
      totalUniqueItems: result.totalUniqueItems,
      pagesProcessed: result.pagesProcessed
    })
    return {
      elements: result.elements,
      totalAmount: result.totalAmount
    }
  } catch (error) {
    logger.warn('Failed to fetch paginated names from marketplace-api, falling back to TheGraph', {
      owner,
      limit,
      offset,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const allNames = await fetchAllNamesFromGraph({ theGraph }, owner)
      const totalAmount = allNames.length
      const elements = allNames.slice(offset, offset + limit)
      logger.debug('Successfully fetched names from TheGraph fallback (paginated locally)', {
        owner,
        limit,
        offset,
        returned: elements.length,
        total: totalAmount
      })
      return {
        elements,
        totalAmount
      }
    } catch (fallbackError) {
      logger.error('Failed to fetch names from both marketplace-api and TheGraph', {
        owner,
        limit,
        offset,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}
