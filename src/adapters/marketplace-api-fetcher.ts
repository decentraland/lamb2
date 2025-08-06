import { IFetchComponent, IConfigComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { ProfileWearable, ProfileEmote, ProfileName } from './marketplace-types'

export interface IMarketplaceApiFetcher {
  getWearablesByOwner(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: ProfileWearable[]; total: number }>

  getEmotesByOwner(address: string, first?: number, skip?: number): Promise<{ data: ProfileEmote[]; total: number }>

  getNamesByOwner(address: string, first?: number, skip?: number): Promise<{ data: ProfileName[]; total: number }>

  getOwnedWearablesUrnAndTokenId(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number }>

  getOwnedEmotesUrnAndTokenId(
    address: string,
    first?: number,
    skip?: number
  ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number }>

  getOwnedNamesOnly(address: string, first?: number, skip?: number): Promise<{ data: string[]; total: number }>
}

export type MarketplaceApiResponse<T> = {
  ok: boolean
  data: {
    elements: T[]
    total: number
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

  async function makeRequest<T>(endpoint: string, params: URLSearchParams): Promise<{ data: T[]; total: number }> {
    const url = `${marketplaceApiUrl}${endpoint}?${params.toString()}`

    try {
      logger.debug('Making request to marketplace API', { url })

      const response = await fetch.fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: MarketplaceApiResponse<T> = await response.json()

      if (!result.ok) {
        throw new Error(result.message || 'Marketplace API request failed')
      }

      return {
        data: result.data.elements,
        total: result.data.total
      }
    } catch (error) {
      logger.error('Error fetching from marketplace API', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
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
      first = 1000,
      skip = 0
    ): Promise<{ data: ProfileWearable[]; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileWearable>(`/v1/users/${address}/wearables`, params)
    },

    async getEmotesByOwner(address: string, first = 1000, skip = 0): Promise<{ data: ProfileEmote[]; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileEmote>(`/v1/users/${address}/emotes`, params)
    },

    async getNamesByOwner(address: string, first = 1000, skip = 0): Promise<{ data: ProfileName[]; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<ProfileName>(`/v1/users/${address}/names`, params)
    },

    async getOwnedWearablesUrnAndTokenId(
      address: string,
      first = 1000,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<{ urn: string; tokenId: string }>(`/v1/users/${address}/wearables/urn-token`, params)
    },

    async getOwnedEmotesUrnAndTokenId(
      address: string,
      first = 1000,
      skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<{ urn: string; tokenId: string }>(`/v1/users/${address}/emotes/urn-token`, params)
    },

    async getOwnedNamesOnly(address: string, first = 1000, skip = 0): Promise<{ data: string[]; total: number }> {
      const params = getPaginationParams(first, skip)

      return makeRequest<string>(`/v1/users/${address}/names/names-only`, params)
    }
  }
}
