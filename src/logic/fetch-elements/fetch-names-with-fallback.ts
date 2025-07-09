import { AppComponents, Name } from '../../types'
import { fetchAllNames as fetchAllNamesFromGraph } from './fetch-names'

/**
 * Fetches all names for a user with fallback logic:
 * 1. Try marketplace-api first
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
    const { data: names } = await marketplaceApiFetcher.getNamesByOwner(owner)
    logger.debug('Successfully fetched names from marketplace-api', {
      owner,
      count: names.length
    })
    return names
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
