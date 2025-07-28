import { AppComponents, OnChainWearable, OnChainEmote } from '../../types'
import {
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../adapters/marketplace-types'
import {
  fetchAllWearables as fetchAllWearablesFromGraph,
  fetchAllEmotes as fetchAllEmotesFromGraph
} from './fetch-items'
import { PaginatedElementsResult } from '../../adapters/elements-fetcher'
import { fetchWearablesWithSmartPagination, fetchEmotesWithSmartPagination } from './smart-pagination-helper'

/**
 * Fetches all wearables for a user with fallback logic:
 * 1. Try marketplace-api first (with automatic pagination)
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchAllWearablesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<OnChainWearable[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-wearables-with-fallback')

  try {
    logger.debug('Attempting to fetch wearables from marketplace-api', { owner })
    const profileWearables = await marketplaceApiFetcher.getAllWearablesByOwner(owner)
    const onChainWearables = fromProfileWearablesToOnChainWearables(profileWearables)
    logger.debug('Successfully fetched wearables from marketplace-api', {
      owner,
      profileWearablesCount: profileWearables.length,
      onChainWearablesCount: onChainWearables.length
    })
    return onChainWearables
  } catch (error) {
    logger.warn('Failed to fetch wearables from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const onChainWearables = await fetchAllWearablesFromGraph({ theGraph }, owner)
      logger.debug('Successfully fetched wearables from TheGraph fallback', {
        owner,
        count: onChainWearables.length
      })
      return onChainWearables
    } catch (fallbackError) {
      logger.error('Failed to fetch wearables from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}

/**
 * Fetches paginated wearables for a user with fallback logic:
 * 1. Try marketplace-api first (using direct pagination)
 * 2. If it fails, fallback to TheGraph (load all and paginate locally)
 */
export async function fetchWearablesPaginatedWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit: number,
  offset: number
): Promise<PaginatedElementsResult<OnChainWearable>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-wearables-paginated-with-fallback')

  try {
    logger.debug('Attempting to fetch paginated wearables using smart pagination', { owner, limit, offset })
    const result = await fetchWearablesWithSmartPagination(marketplaceApiFetcher, owner, limit, offset, logger)
    logger.debug('Successfully fetched paginated wearables using smart pagination', {
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
    logger.warn('Failed to fetch paginated wearables from marketplace-api, falling back to TheGraph', {
      owner,
      limit,
      offset,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const allWearables = await fetchAllWearablesFromGraph({ theGraph }, owner)
      const totalAmount = allWearables.length
      const elements = allWearables.slice(offset, offset + limit)
      logger.debug('Successfully fetched wearables from TheGraph fallback (paginated locally)', {
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
      logger.error('Failed to fetch wearables from both marketplace-api and TheGraph', {
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

/**
 * Fetches all emotes for a user with fallback logic:
 * 1. Try marketplace-api first (with automatic pagination)
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchAllEmotesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<OnChainEmote[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-emotes-with-fallback')

  try {
    logger.debug('Attempting to fetch emotes from marketplace-api', { owner })
    const profileEmotes = await marketplaceApiFetcher.getAllEmotesByOwner(owner)
    const onChainEmotes = fromProfileEmotesToOnChainEmotes(profileEmotes)
    logger.debug('Successfully fetched emotes from marketplace-api', {
      owner,
      profileEmotesCount: profileEmotes.length,
      onChainEmotesCount: onChainEmotes.length
    })
    return onChainEmotes
  } catch (error) {
    logger.warn('Failed to fetch emotes from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const onChainEmotes = await fetchAllEmotesFromGraph({ theGraph }, owner)
      logger.debug('Successfully fetched emotes from TheGraph fallback', {
        owner,
        count: onChainEmotes.length
      })
      return onChainEmotes
    } catch (fallbackError) {
      logger.error('Failed to fetch emotes from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}

/**
 * Fetches paginated emotes for a user with fallback logic:
 * 1. Try marketplace-api first (using direct pagination)
 * 2. If it fails, fallback to TheGraph (load all and paginate locally)
 */
export async function fetchEmotesPaginatedWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit: number,
  offset: number
): Promise<PaginatedElementsResult<OnChainEmote>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-emotes-paginated-with-fallback')

  try {
    logger.debug('Attempting to fetch paginated emotes using smart pagination', { owner, limit, offset })
    const result = await fetchEmotesWithSmartPagination(marketplaceApiFetcher, owner, limit, offset, logger)
    logger.debug('Successfully fetched paginated emotes using smart pagination', {
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
    logger.warn('Failed to fetch paginated emotes from marketplace-api, falling back to TheGraph', {
      owner,
      limit,
      offset,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const allEmotes = await fetchAllEmotesFromGraph({ theGraph }, owner)
      const totalAmount = allEmotes.length
      const elements = allEmotes.slice(offset, offset + limit)
      logger.debug('Successfully fetched emotes from TheGraph fallback (paginated locally)', {
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
      logger.error('Failed to fetch emotes from both marketplace-api and TheGraph', {
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
