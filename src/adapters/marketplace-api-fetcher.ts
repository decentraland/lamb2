import { IFetchComponent } from '@well-known-components/interfaces'
import { IConfigComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { ProfileName } from './marketplace-types'
import { OnChainWearable, OnChainEmote } from '../types'

export const MARKETPLACE_API_BATCH_SIZE = 5000

export interface IMarketplaceApiFetcher {
  // Main methods now return grouped data by default
  getWearablesByOwner(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: OnChainWearable[]; total: number }>
  getEmotesByOwner(address: string, first?: number, skip?: number): Promise<{ data: OnChainEmote[]; total: number }>
  getNamesByOwner(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: ProfileName[]; total: number; totalItems: number }>
  getOwnedWearablesUrnAndTokenId(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }>
  getOwnedEmotesUrnAndTokenId(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }>
  getOwnedNamesOnly(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: string[]; total: number; totalItems: number }>

  // Methods to fetch ALL results automatically with pagination - now return grouped data
  getAllWearablesByOwner(address: string): Promise<OnChainWearable[]>
  getAllEmotesByOwner(address: string): Promise<OnChainEmote[]>
  getAllNamesByOwner(address: string): Promise<ProfileName[]>
}

export type MarketplaceApiResponse<T> = {
  ok: boolean
  data: {
    elements: T[]
    total: number
    totalItems?: number
    page: number
    pages: number
    limit: number
  }
  message?: string
}

export async function createMarketplaceApiFetcher(components: {
  fetch: IFetchComponent
  config: IConfigComponent
  logs: ILoggerComponent
}): Promise<IMarketplaceApiFetcher> {
  const { fetch, config, logs } = components
  const logger = logs.getLogger('marketplace-api-fetcher')
  const marketplaceApiUrl = (await config.requireString('MARKETPLACE_API_URL')) as string

  // Unified request function that handles both regular and grouped endpoints
  async function makeRequest<T>(
    endpoint: string,
    params: URLSearchParams
  ): Promise<{ data: T[]; total: number; totalItems?: number }> {
    const url = new URL(endpoint, marketplaceApiUrl)
    params.forEach((value, key) => url.searchParams.set(key, value))

    try {
      logger.debug('Making request to marketplace API', { url: url.toString() })
      const response = await fetch.fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: MarketplaceApiResponse<T> = await response.json()

      if (!result.ok) {
        throw new Error(result.message || 'Marketplace API request failed')
      }

      return {
        data: result.data.elements,
        total: result.data.total,
        totalItems: result.data.totalItems // Optional - only present for some endpoints
      }
    } catch (error) {
      logger.error('Error fetching from marketplace API', {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async function fetchAllPaginated<T>(endpoint: string, address: string): Promise<T[]> {
    const allElements: T[] = []
    let currentPage = 1
    let totalPages = 1

    logger.debug('Starting paginated fetch from marketplace API', { endpoint, address })

    do {
      const params = getPaginationParams(MARKETPLACE_API_BATCH_SIZE, (currentPage - 1) * MARKETPLACE_API_BATCH_SIZE)
      const response = await fetch.fetch(`${marketplaceApiUrl}${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: MarketplaceApiResponse<T> = await response.json()

      if (!result.ok) {
        throw new Error(result.message || 'Marketplace API request failed')
      }

      // Add elements from this page
      allElements.push(...result.data.elements)

      // Update pagination info
      totalPages = result.data.pages
      currentPage += 1

      logger.debug('Fetched page from marketplace API', {
        endpoint,
        address,
        page: result.data.page,
        pages: result.data.pages,
        elementsThisPage: result.data.elements.length,
        totalElementsSoFar: allElements.length,
        total: result.data.total
      })

      // Break if no more elements or if we've reached the last page
      if (result.data.elements.length === 0 || currentPage > totalPages) {
        break
      }
    } while (currentPage <= totalPages)

    logger.debug('Completed paginated fetch from marketplace API', {
      endpoint,
      address,
      totalElements: allElements.length,
      totalPages: currentPage - 1
    })

    return allElements
  }

  function getPaginationParams(first: number, skip: number) {
    return new URLSearchParams({
      first: first.toString(),
      skip: skip.toString()
    })
  }

  return {
    // Main methods now return grouped data by default
    async getWearablesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: OnChainWearable[]; total: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<OnChainWearable>(`/v1/users/${address}/wearables/grouped`, params)
      return { data: result.data, total: result.total }
    },

    async getEmotesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: OnChainEmote[]; total: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<OnChainEmote>(`/v1/users/${address}/emotes/grouped`, params)
      return { data: result.data, total: result.total }
    },

    async getNamesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: ProfileName[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<ProfileName>(`/v1/users/${address}/names`, params)
      return {
        data: result.data,
        total: result.total,
        totalItems: result.totalItems || result.total
      }
    },

    async getOwnedWearablesUrnAndTokenId(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<{ urn: string; tokenId: string }>(
        `/v1/users/${address}/wearables/urn-token`,
        params
      )
      return {
        data: result.data,
        total: result.total,
        totalItems: result.totalItems || result.total
      }
    },

    async getOwnedEmotesUrnAndTokenId(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<{ urn: string; tokenId: string }>(
        `/v1/users/${address}/emotes/urn-token`,
        params
      )
      return {
        data: result.data,
        total: result.total,
        totalItems: result.totalItems || result.total
      }
    },

    async getOwnedNamesOnly(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: string[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)
      const result = await makeRequest<string>(`/v1/users/${address}/names/names-only`, params)
      return {
        data: result.data,
        total: result.total,
        totalItems: result.totalItems || result.total
      }
    },

    // Methods to fetch ALL results with automatic pagination - now return grouped data
    async getAllWearablesByOwner(address: string): Promise<OnChainWearable[]> {
      return fetchAllPaginated<OnChainWearable>(`/v1/users/${address}/wearables/grouped`, address)
    },

    async getAllEmotesByOwner(address: string): Promise<OnChainEmote[]> {
      return fetchAllPaginated<OnChainEmote>(`/v1/users/${address}/emotes/grouped`, address)
    },

    async getAllNamesByOwner(address: string): Promise<ProfileName[]> {
      return fetchAllPaginated<ProfileName>(`/v1/users/${address}/names`, address)
    }
  }
}
