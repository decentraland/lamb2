import { IBaseComponent } from '@well-known-components/interfaces'
import { WearableCategory, EmoteCategory } from '@dcl/schemas'
import { OnChainWearable, OnChainEmote, Name, AppComponents } from '../types'
import { ItemType } from './elements-fetcher'

/**
 * Marketplace API response types matching the marketplace-server API
 */
type MarketplaceApiBaseData = {
  urn: string
  id: string
  tokenId: string
  transferredAt: string | null
  name: string
  rarity: string
  price?: number
}

export type MarketplaceApiWearable = MarketplaceApiBaseData & {
  category: WearableCategory
}

export type MarketplaceApiEmote = MarketplaceApiBaseData & {
  category: EmoteCategory
}

export type MarketplaceApiName = {
  name: string
  contractAddress: string
  tokenId: string
  price?: number
}

type MarketplaceApiGroupedBaseData = {
  urn: string
  amount: number
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: string
    price: string
  }>
  name: string
  rarity: string
  minTransferredAt: number
  maxTransferredAt: number
}

export type MarketplaceApiGroupedWearable = MarketplaceApiGroupedBaseData & {
  category: WearableCategory
}

export type MarketplaceApiGroupedEmote = MarketplaceApiGroupedBaseData & {
  category: EmoteCategory
}

export type MarketplaceApiResponse<T> = {
  ok: boolean
  data: {
    elements: T[]
    page: number
    pages: number
    limit: number
    total: number
  }
}

/**
 * Query parameters for marketplace API requests (transparent pass-through)
 */
export type MarketplaceApiParams = {
  // Pagination
  limit?: number
  offset?: number

  // Filtering
  category?: string
  rarity?: string
  name?: string

  // Sorting
  orderBy?: string
  direction?: string

  // Item type
  itemType?: ItemType
}

/**
 * MarketplaceApiFetcher provides methods to fetch user assets from marketplace-server API
 */
export type MarketplaceApiFetcher = IBaseComponent & {
  /**
   * Fetches user wearables from marketplace-server API using grouped endpoint
   * @param address - User's Ethereum address
   * @param params - Optional query parameters (pagination, filtering, sorting)
   * @returns Promise resolving to OnChainWearable array with total count
   */
  fetchUserWearables(
    address: string,
    params?: MarketplaceApiParams
  ): Promise<{ wearables: OnChainWearable[]; total?: number }>

  /**
   * Fetches user emotes from marketplace-server API using grouped endpoint
   * @param address - User's Ethereum address
   * @param params - Optional query parameters (pagination, filtering, sorting)
   * @returns Promise resolving to OnChainEmote array with total count
   */
  fetchUserEmotes(address: string, params?: MarketplaceApiParams): Promise<{ emotes: OnChainEmote[]; total?: number }>

  /**
   * Fetches user names from marketplace-server API
   * @param address - User's Ethereum address
   * @param params - Optional query parameters (pagination, filtering, sorting)
   * @returns Promise resolving to Name array with total count
   */
  fetchUserNames(address: string, params?: MarketplaceApiParams): Promise<{ names: Name[]; total?: number }>
}

/**
 * Error thrown when marketplace API is unavailable or returns an error
 */
export class MarketplaceApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'MarketplaceApiError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Maps marketplace API grouped wearable to lamb2 OnChainWearable format
 */
function mapGroupedWearableToOnChainWearable(grouped: MarketplaceApiGroupedWearable): OnChainWearable {
  return {
    urn: grouped.urn,
    amount: grouped.amount,
    individualData: grouped.individualData.map((item) => ({
      id: item.id,
      tokenId: item.tokenId,
      transferredAt: item.transferredAt,
      price: item.price
    })),
    name: grouped.name,
    rarity: grouped.rarity,
    minTransferredAt: grouped.minTransferredAt,
    maxTransferredAt: grouped.maxTransferredAt,
    category: grouped.category
  }
}

/**
 * Maps marketplace API grouped emote to lamb2 OnChainEmote format
 */
function mapGroupedEmoteToOnChainEmote(grouped: MarketplaceApiGroupedEmote): OnChainEmote {
  return {
    urn: grouped.urn,
    amount: grouped.amount,
    individualData: grouped.individualData.map((item) => ({
      id: item.id,
      tokenId: item.tokenId,
      transferredAt: item.transferredAt,
      price: item.price
    })),
    name: grouped.name,
    rarity: grouped.rarity,
    minTransferredAt: grouped.minTransferredAt,
    maxTransferredAt: grouped.maxTransferredAt,
    category: grouped.category
  }
}

/**
 * Maps marketplace API name to lamb2 Name format
 */
function mapApiNameToName(apiName: MarketplaceApiName): Name {
  return {
    name: apiName.name,
    contractAddress: apiName.contractAddress,
    tokenId: apiName.tokenId,
    ...(apiName.price !== undefined && apiName.price !== null ? { price: apiName.price } : {})
  }
}

/**
 * Creates a MarketplaceApiFetcher component
 */
export async function createMarketplaceApiFetcher(
  components: Pick<AppComponents, 'config' | 'fetch' | 'logs'>
): Promise<MarketplaceApiFetcher> {
  const { config, fetch, logs } = components
  const logger = logs.getLogger('marketplace-api-fetcher')

  // Get marketplace API base URL from config
  const marketplaceApiUrl = await config.getString('MARKETPLACE_API_URL')
  if (!marketplaceApiUrl) {
    throw new Error('MARKETPLACE_API_URL configuration is required')
  }

  const baseUrl = marketplaceApiUrl.replace(/\/$/, '') // Remove trailing slash

  /**
   * Builds endpoint URL with query parameters (transparent pass-through)
   */
  function buildEndpointWithParams(baseEndpoint: string, params?: MarketplaceApiParams): string {
    if (!params) {
      return baseEndpoint
    }

    const queryParams = new URLSearchParams()

    // Add all parameters transparently
    if (params.limit !== undefined) {
      queryParams.set('limit', String(params.limit))
    }
    if (params.offset !== undefined) {
      queryParams.set('offset', String(params.offset))
    }
    if (params.category) {
      queryParams.set('category', params.category)
    }
    if (params.rarity) {
      queryParams.set('rarity', params.rarity)
    }
    if (params.name) {
      queryParams.set('name', params.name)
    }
    if (params.orderBy) {
      queryParams.set('orderBy', params.orderBy)
    }
    if (params.direction) {
      queryParams.set('direction', params.direction)
    }
    if (params.itemType) {
      if (params.itemType === 'smartWearable') {
        queryParams.append('itemType', 'smart_wearable_v1')
      } else if (params.itemType === 'polygonWearables') {
        // polygonWearables includes both wearable_v2 and smart_wearable_v1
        queryParams.append('itemType', 'wearable_v2')
        queryParams.append('itemType', 'smart_wearable_v1')
      }
    }

    const queryString = queryParams.toString()
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint
  }

  /**
   * Makes a request to the marketplace API with error handling
   */
  async function makeApiRequest<T>(endpoint: string): Promise<T> {
    const url = `${baseUrl}${endpoint}`
    logger.debug(`Fetching from marketplace API: ${url}`)

    try {
      const response = await fetch.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add a reasonable timeout
        timeout: 10000 // 10 seconds
      })

      if (!response.ok) {
        throw new MarketplaceApiError(`Marketplace API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      logger.debug(`Successfully fetched from marketplace API: ${url}`)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to fetch from marketplace API: ${url}`, { error: errorMessage })

      if (error instanceof MarketplaceApiError) {
        throw error
      }

      throw new MarketplaceApiError(`Failed to fetch from marketplace API: ${errorMessage}`, error as Error)
    }
  }

  /**
   * Fetches all pages of data from a paginated endpoint
   */
  async function fetchAllPages<T>(baseEndpoint: string): Promise<T[]> {
    const allItems: T[] = []
    let page = 1
    let hasMore = true
    const PAGE_SIZE = 1000

    while (hasMore) {
      const endpoint = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`
      const response = await makeApiRequest<MarketplaceApiResponse<T>>(endpoint)

      allItems.push(...response.data.elements)

      // Check if there are more pages
      hasMore = page < response.data.pages
      page++
    }

    return allItems
  }

  async function fetchUserWearables(
    address: string,
    params?: MarketplaceApiParams
  ): Promise<{ wearables: OnChainWearable[]; total?: number }> {
    try {
      const baseEndpoint = `/v1/users/${address.toLowerCase()}/wearables/grouped`
      const endpoint = buildEndpointWithParams(baseEndpoint, params)
      let groupedWearables: MarketplaceApiGroupedWearable[]
      let total: number | undefined

      if (params && (params.limit !== undefined || params.offset !== undefined)) {
        // Use direct API call with parameters
        const response = await makeApiRequest<MarketplaceApiResponse<MarketplaceApiGroupedWearable>>(endpoint)
        // Validate response structure
        if (!response || !response.data || !Array.isArray(response.data.elements)) {
          throw new MarketplaceApiError(
            `Invalid API response structure: expected response.data.elements to be an array`
          )
        }
        groupedWearables = response.data.elements
        total = response.data.total
      } else {
        // Fallback to fetching all pages when no pagination specified
        groupedWearables = await fetchAllPages<MarketplaceApiGroupedWearable>(endpoint)
        total = groupedWearables.length // For fallback, total is the actual count
      }

      return {
        wearables: groupedWearables.map(mapGroupedWearableToOnChainWearable),
        total
      }
    } catch (error) {
      logger.error(`Failed to fetch user wearables for ${address}`, {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async function fetchUserEmotes(
    address: string,
    params?: MarketplaceApiParams
  ): Promise<{ emotes: OnChainEmote[]; total?: number }> {
    try {
      const baseEndpoint = `/v1/users/${address.toLowerCase()}/emotes/grouped`
      const endpoint = buildEndpointWithParams(baseEndpoint, params)

      let groupedEmotes: MarketplaceApiGroupedEmote[]
      let total: number | undefined

      if (params && (params.limit !== undefined || params.offset !== undefined)) {
        // Use direct API call with parameters
        const response = await makeApiRequest<MarketplaceApiResponse<MarketplaceApiGroupedEmote>>(endpoint)
        // Validate response structure
        if (!response || !response.data || !Array.isArray(response.data.elements)) {
          throw new MarketplaceApiError(
            `Invalid API response structure: expected response.data.elements to be an array`
          )
        }
        groupedEmotes = response.data.elements
        total = response.data.total
      } else {
        // Fallback to fetching all pages when no pagination specified
        groupedEmotes = await fetchAllPages<MarketplaceApiGroupedEmote>(baseEndpoint)
        total = groupedEmotes.length // For fallback, total is the actual count
      }

      return {
        emotes: groupedEmotes.map(mapGroupedEmoteToOnChainEmote),
        total
      }
    } catch (error) {
      logger.error(`Failed to fetch user emotes for ${address}`, {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async function fetchUserNames(
    address: string,
    params?: MarketplaceApiParams
  ): Promise<{ names: Name[]; total?: number }> {
    try {
      const baseEndpoint = `/v1/users/${address.toLowerCase()}/names`
      const endpoint = buildEndpointWithParams(baseEndpoint, params)

      let apiNames: MarketplaceApiName[]
      let total: number | undefined

      if (params && (params.limit !== undefined || params.offset !== undefined)) {
        // Use direct API call with parameters
        const response = await makeApiRequest<MarketplaceApiResponse<MarketplaceApiName>>(endpoint)
        // Validate response structure
        if (!response || !response.data || !Array.isArray(response.data.elements)) {
          throw new MarketplaceApiError(
            `Invalid API response structure: expected response.data.elements to be an array`
          )
        }
        apiNames = response.data.elements
        total = response.data.total
      } else {
        // Fallback to fetching all pages when no pagination specified
        apiNames = await fetchAllPages<MarketplaceApiName>(baseEndpoint)
        total = apiNames.length // For fallback, total is the actual count
      }

      return {
        names: apiNames.map(mapApiNameToName),
        total
      }
    } catch (error) {
      logger.error(`Failed to fetch user names for ${address}`, {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  return {
    fetchUserWearables,
    fetchUserEmotes,
    fetchUserNames
  }
}
