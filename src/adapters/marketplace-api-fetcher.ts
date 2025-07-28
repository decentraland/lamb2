import { IFetchComponent, IConfigComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { ProfileWearable, ProfileEmote, ProfileName } from './marketplace-types'

export const MARKETPLACE_API_BATCH_SIZE = 5000

export interface IMarketplaceApiFetcher {
  getWearablesByOwner(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: ProfileWearable[]; total: number; totalItems: number }>
  getEmotesByOwner(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: ProfileEmote[]; total: number; totalItems: number }>
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

  // Methods to fetch ALL results automatically with pagination
  getAllWearablesByOwner(address: string): Promise<ProfileWearable[]>
  getAllEmotesByOwner(address: string): Promise<ProfileEmote[]>
  getAllNamesByOwner(address: string): Promise<ProfileName[]>
}

export type MarketplaceApiResponse<T> = {
  ok: boolean
  data: {
    elements: T[]
    total: number
    totalItems: number
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

  async function makeRequest<T>(
    endpoint: string,
    params: URLSearchParams
  ): Promise<{ data: T[]; total: number; totalItems: number }> {
    const url = `${marketplaceApiUrl}${endpoint}?${params.toString()}`

    try {
      logger.debug('Making request to marketplace API', { url })
      const response = await fetch.fetch(url, {
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
        totalItems: result.data.totalItems
      }
    } catch (error) {
      logger.error('Error fetching from marketplace API', {
        url,
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
    async getWearablesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: ProfileWearable[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileWearable>(`/v1/users/${address}/wearables`, params)
    },

    async getEmotesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: ProfileEmote[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileEmote>(`/v1/users/${address}/emotes`, params)
    },

    async getNamesByOwner(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: ProfileName[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileName>(`/v1/users/${address}/names`, params)
    },

    async getOwnedWearablesUrnAndTokenId(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<{ urn: string; tokenId: string }>(`/v1/users/${address}/wearables/urn-token`, params)
    },

    async getOwnedEmotesUrnAndTokenId(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<{ urn: string; tokenId: string }>(`/v1/users/${address}/emotes/urn-token`, params)
    },

    async getOwnedNamesOnly(
      address: string,
      first = MARKETPLACE_API_BATCH_SIZE,
      skip = 0
    ): Promise<{ data: string[]; total: number; totalItems: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<string>(`/v1/users/${address}/names/names-only`, params)
    },

    // New methods to fetch ALL results with automatic pagination
    async getAllWearablesByOwner(address: string): Promise<ProfileWearable[]> {
      return fetchAllPaginated<ProfileWearable>(`/v1/users/${address}/wearables`, address)
    },

    async getAllEmotesByOwner(address: string): Promise<ProfileEmote[]> {
      return fetchAllPaginated<ProfileEmote>(`/v1/users/${address}/emotes`, address)
    },

    async getAllNamesByOwner(address: string): Promise<ProfileName[]> {
      return fetchAllPaginated<ProfileName>(`/v1/users/${address}/names`, address)
    }
  }
}
