import { ILoggerComponent } from '@well-known-components/interfaces'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../adapters/marketplace-types'
import { OnChainWearable, OnChainEmote, Name } from '../../types'
import {
  fromProfileWearablesToOnChainWearables,
  fromProfileEmotesToOnChainEmotes
} from '../../adapters/marketplace-types'
import { IMarketplaceApiFetcher } from '../../adapters/marketplace-api-fetcher'

export type SmartPaginationResult<T> = {
  elements: T[]
  totalAmount: number
  totalUniqueItems: number
  pagesProcessed: number
}

/**
 * Fetches elements from marketplace-api using smart pagination.
 * Continues fetching pages until the desired number of unique elements is reached,
 * or until no more pages are available.
 *
 * @param fetcher Function that fetches a page from marketplace-api
 * @param transformer Function that transforms marketplace-api data to the desired format
 * @param targetPageSize Number of unique elements desired
 * @param targetOffset Starting offset for the result set
 * @param logger Logger instance for debugging
 * @returns Promise with the elements, total counts, and metadata
 */
export async function fetchWithSmartPagination<TSource, TTarget>(
  fetcher: (limit: number, offset: number) => Promise<{ data: TSource[]; total: number; totalItems: number }>,
  transformer: (data: TSource[]) => TTarget[],
  targetPageSize: number,
  targetOffset: number,
  logger: ILoggerComponent.ILogger
): Promise<SmartPaginationResult<TTarget>> {
  logger.debug('Starting smart pagination', { targetPageSize, targetOffset })

  const allUniqueElements: TTarget[] = []
  let currentOffset = 0
  let pagesProcessed = 0
  let totalAmount = 0
  let totalUniqueItems = 0
  let hasMorePages = true

  // First, we need to "skip" the targetOffset number of unique elements
  // This is more complex because we need to process pages until we've skipped enough unique elements
  while (hasMorePages && allUniqueElements.length < targetOffset + targetPageSize) {
    try {
      // Use a reasonable page size for marketplace-api requests
      // We'll use a larger page size to reduce API calls
      const apiPageSize = Math.max(targetPageSize * 2, 200) // At least 200, or 2x target size

      logger.debug('Fetching page from marketplace-api', {
        currentOffset,
        apiPageSize,
        uniqueElementsSoFar: allUniqueElements.length,
        target: targetOffset + targetPageSize
      })

      const response = await fetcher(apiPageSize, currentOffset)
      pagesProcessed++

      // Update totals from the first response
      if (pagesProcessed === 1) {
        totalAmount = response.total
        totalUniqueItems = response.totalItems
      }

      logger.debug('Received response from marketplace-api', {
        page: pagesProcessed,
        receivedElements: response.data.length,
        total: response.total,
        totalItems: response.totalItems
      })

      if (response.data.length === 0) {
        logger.debug('No more elements available, stopping pagination')
        hasMorePages = false
        break
      }

      // Transform the data to get unique elements
      const transformedElements = transformer(response.data)

      // Add new unique elements to our collection
      for (const element of transformedElements) {
        // Check if this element is already in our collection (by URN if it has one)
        const elementKey = (element as any).urn || JSON.stringify(element)
        const exists = allUniqueElements.some((existing) => {
          const existingKey = (existing as any).urn || JSON.stringify(existing)
          return existingKey === elementKey
        })

        if (!exists) {
          allUniqueElements.push(element)
        }
      }

      logger.debug('Processed page', {
        page: pagesProcessed,
        transformedElements: transformedElements.length,
        totalUniqueElements: allUniqueElements.length,
        target: targetOffset + targetPageSize
      })

      // Move to next page
      currentOffset += apiPageSize

      // Check if we have enough elements or if we've reached the end
      if (response.data.length < apiPageSize) {
        logger.debug('Received fewer elements than requested, no more pages available')
        hasMorePages = false
      }
    } catch (error) {
      logger.error('Error during smart pagination', {
        page: pagesProcessed + 1,
        currentOffset,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // Now slice the results according to targetOffset and targetPageSize
  const finalElements = allUniqueElements.slice(targetOffset, targetOffset + targetPageSize)

  logger.debug('Smart pagination completed', {
    totalUniqueElements: allUniqueElements.length,
    targetOffset,
    targetPageSize,
    finalElements: finalElements.length,
    pagesProcessed,
    totalAmount,
    totalUniqueItems
  })

  return {
    elements: finalElements,
    totalAmount: totalUniqueItems, // Use the total unique items from marketplace-api
    totalUniqueItems,
    pagesProcessed
  }
}

/**
 * Smart pagination specifically for wearables
 */
export async function fetchWearablesWithSmartPagination(
  marketplaceApiFetcher: IMarketplaceApiFetcher,
  address: string,
  limit: number,
  offset: number,
  logger: ILoggerComponent.ILogger
): Promise<SmartPaginationResult<OnChainWearable>> {
  return fetchWithSmartPagination<ProfileWearable, OnChainWearable>(
    (apiLimit, apiOffset) => marketplaceApiFetcher.getWearablesByOwner(address, apiLimit, apiOffset),
    fromProfileWearablesToOnChainWearables,
    limit,
    offset,
    logger
  )
}

/**
 * Smart pagination specifically for emotes
 */
export async function fetchEmotesWithSmartPagination(
  marketplaceApiFetcher: IMarketplaceApiFetcher,
  address: string,
  limit: number,
  offset: number,
  logger: ILoggerComponent.ILogger
): Promise<SmartPaginationResult<OnChainEmote>> {
  return fetchWithSmartPagination<ProfileEmote, OnChainEmote>(
    (apiLimit, apiOffset) => marketplaceApiFetcher.getEmotesByOwner(address, apiLimit, apiOffset),
    fromProfileEmotesToOnChainEmotes,
    limit,
    offset,
    logger
  )
}

/**
 * Smart pagination specifically for names
 */
export async function fetchNamesWithSmartPagination(
  marketplaceApiFetcher: IMarketplaceApiFetcher,
  address: string,
  limit: number,
  offset: number,
  logger: ILoggerComponent.ILogger
): Promise<SmartPaginationResult<Name>> {
  return fetchWithSmartPagination<ProfileName, Name>(
    (apiLimit, apiOffset) => marketplaceApiFetcher.getNamesByOwner(address, apiLimit, apiOffset),
    (data) => data, // Names don't need transformation, they're already unique
    limit,
    offset,
    logger
  )
}
