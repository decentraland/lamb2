import { AppComponents, OnChainWearable, OnChainEmote } from '../../types'
import {
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../adapters/marketplace-types'
import {
  fetchAllWearables as fetchAllWearablesFromGraph,
  fetchAllEmotes as fetchAllEmotesFromGraph
} from './fetch-items'

/**
 * Fetches all wearables for a user with fallback logic:
 * 1. Try marketplace-api first
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
    const { data: profileWearables, total } = await marketplaceApiFetcher.getWearablesByOwner(owner)
    const onChainWearables = fromProfileWearablesToOnChainWearables(profileWearables)
    logger.debug('Successfully fetched wearables from marketplace-api', {
      owner,
      count: total
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
 * Fetches all emotes for a user with fallback logic:
 * 1. Try marketplace-api first
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
    const { data: profileEmotes } = await marketplaceApiFetcher.getEmotesByOwner(owner)
    const onChainEmotes = fromProfileEmotesToOnChainEmotes(profileEmotes)
    logger.debug('Successfully fetched emotes from marketplace-api', {
      owner,
      count: onChainEmotes.length
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
