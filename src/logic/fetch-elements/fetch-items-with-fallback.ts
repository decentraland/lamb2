import { OnChainWearable, OnChainEmote, AppComponents } from '../../types'
import { fetchAllWearables, fetchAllEmotes } from './fetch-items'
import { PaginatedElementsResult } from '../../adapters/elements-fetcher'

/**
 * Fetches wearables for a user with fallback logic:
 * 1. Try marketplace-api first
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchWearablesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit?: number,
  offset?: number
): Promise<PaginatedElementsResult<OnChainWearable>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-wearables-with-fallback')

  try {
    logger.debug('Attempting to fetch wearables from marketplace-api', {
      owner,
      limit: limit || 100,
      offset: offset || 0
    })
    const result = await marketplaceApiFetcher.getWearablesByOwner(owner, limit || 100, offset || 0)
    logger.debug('Successfully fetched wearables from marketplace-api', {
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
    logger.warn('Failed to fetch wearables from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // Fallback to TheGraph
    try {
      const allWearables = await fetchAllWearables({ theGraph }, owner)
      const actualLimit = limit || allWearables.length
      const actualOffset = offset || 0
      const elements = allWearables.slice(actualOffset, actualOffset + actualLimit)

      logger.debug('Successfully fetched wearables from TheGraph fallback', {
        owner,
        limit: actualLimit,
        offset: actualOffset,
        returned: elements.length,
        total: allWearables.length
      })
      return {
        elements,
        totalAmount: allWearables.length
      }
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
 * Fetches emotes for a user with fallback logic:
 * 1. Try marketplace-api first
 * 2. If it fails, fallback to TheGraph
 */
export async function fetchEmotesWithFallback(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string,
  limit?: number,
  offset?: number
): Promise<PaginatedElementsResult<OnChainEmote>> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-emotes-with-fallback')

  try {
    logger.debug('Attempting to fetch emotes from marketplace-api', { owner, limit: limit || 100, offset: offset || 0 })
    const result = await marketplaceApiFetcher.getEmotesByOwner(owner, limit || 100, offset || 0)
    logger.debug('Successfully fetched emotes from marketplace-api', {
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
    logger.warn('Failed to fetch emotes from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // Fallback to TheGraph
    try {
      const allEmotes = await fetchAllEmotes({ theGraph }, owner)
      const actualLimit = limit || allEmotes.length
      const actualOffset = offset || 0
      const elements = allEmotes.slice(actualOffset, actualOffset + actualLimit)

      logger.debug('Successfully fetched emotes from TheGraph fallback', {
        owner,
        limit: actualLimit,
        offset: actualOffset,
        returned: elements.length,
        total: allEmotes.length
      })
      return {
        elements,
        totalAmount: allEmotes.length
      }
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
 * Fetches ALL wearables for a user (used only for profiles that need complete ownership data)
 * Makes multiple paginated calls to get every single wearable owned by the user
 */
export async function fetchAllWearablesForProfile(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<OnChainWearable[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-all-wearables-for-profile')

  try {
    logger.debug('Attempting to fetch ALL wearables from marketplace-api for profile', { owner })
    const result = await marketplaceApiFetcher.getAllWearablesByOwner(owner)
    logger.debug('Successfully fetched ALL wearables from marketplace-api for profile', {
      owner,
      count: result.length
    })
    return result
  } catch (error) {
    logger.warn('Failed to fetch ALL wearables from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const result = await fetchAllWearables({ theGraph }, owner)
      logger.debug('Successfully fetched ALL wearables from TheGraph fallback for profile', {
        owner,
        count: result.length
      })
      return result
    } catch (fallbackError) {
      logger.error('Failed to fetch ALL wearables from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}

/**
 * Fetches ALL emotes for a user (used only for profiles that need complete ownership data)
 * Makes multiple paginated calls to get every single emote owned by the user
 */
export async function fetchAllEmotesForProfile(
  components: Pick<AppComponents, 'theGraph' | 'marketplaceApiFetcher' | 'logs'>,
  owner: string
): Promise<OnChainEmote[]> {
  const { marketplaceApiFetcher, theGraph, logs } = components
  const logger = logs.getLogger('fetch-all-emotes-for-profile')

  try {
    logger.debug('Attempting to fetch ALL emotes from marketplace-api for profile', { owner })
    const result = await marketplaceApiFetcher.getAllEmotesByOwner(owner)
    logger.debug('Successfully fetched ALL emotes from marketplace-api for profile', {
      owner,
      count: result.length
    })
    return result
  } catch (error) {
    logger.warn('Failed to fetch ALL emotes from marketplace-api, falling back to TheGraph', {
      owner,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    try {
      const result = await fetchAllEmotes({ theGraph }, owner)
      logger.debug('Successfully fetched ALL emotes from TheGraph fallback for profile', {
        owner,
        count: result.length
      })
      return result
    } catch (fallbackError) {
      logger.error('Failed to fetch ALL emotes from both marketplace-api and TheGraph', {
        owner,
        marketplaceError: error instanceof Error ? error.message : 'Unknown error',
        graphError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      })
      throw fallbackError
    }
  }
}
