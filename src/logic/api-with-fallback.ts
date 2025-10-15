import { MarketplaceApiError } from '../adapters/marketplace-api-fetcher'
import { AppComponents } from '../types'

/**
 * Generic function to fetch data with marketplace API as primary source
 * and TheGraph as fallback, with comprehensive error handling and logging
 */
export async function fetchWithMarketplaceFallback<T>(
  components: Pick<AppComponents, 'marketplaceApiFetcher' | 'theGraph' | 'logs'>,
  operation: string,
  marketplaceApiCall: () => Promise<T>,
  theGraphFallback: () => Promise<T>
): Promise<T> {
  const { marketplaceApiFetcher, logs } = components

  // If no marketplace API fetcher available, go directly to TheGraph
  if (!marketplaceApiFetcher) {
    return theGraphFallback()
  }

  const logger = logs.getLogger(`fetch-${operation}`)

  try {
    logger.debug(`Attempting to fetch ${operation} from marketplace API`)
    const result = await marketplaceApiCall()
    logger.debug(`Successfully fetched ${operation} from marketplace API`)
    return result
  } catch (error) {
    if (error instanceof MarketplaceApiError) {
      logger.warn(`Marketplace API failed for ${operation}, falling back to The Graph`, {
        error: error.message
      })
    } else {
      logger.error(`Unexpected error with marketplace API for ${operation}, falling back to The Graph`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }

    // Fall back to TheGraph
    return theGraphFallback()
  }
}
