import { WearableCategory, EmoteCategory } from '@dcl/schemas'
import { IMarketplaceApiFetcher } from '../../src/adapters/marketplace-api-fetcher'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../src/adapters/marketplace-types'

export function createMarketplaceApiMock(): IMarketplaceApiFetcher {
  return {
    async getWearablesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: ProfileWearable[]; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    async getEmotesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: ProfileEmote[]; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    async getNamesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: ProfileName[]; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    async getOwnedWearablesUrnAndTokenId(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    async getOwnedEmotesUrnAndTokenId(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    async getOwnedNamesOnly(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: string[]; total: number; totalItems: number }> {
      return { data: [], total: 0, totalItems: 0 }
    },

    // New methods to fetch ALL results automatically with pagination
    async getAllWearablesByOwner(_address: string): Promise<ProfileWearable[]> {
      return []
    },

    async getAllEmotesByOwner(_address: string): Promise<ProfileEmote[]> {
      return []
    },

    async getAllNamesByOwner(_address: string): Promise<ProfileName[]> {
      return []
    }
  }
}

export function createMockProfileWearable(): ProfileWearable {
  return {
    id: 'mock-id',
    urn: 'urn:decentraland:matic:collections-v2:0xmock:0',
    tokenId: '1',
    name: 'Mock Wearable',
    category: WearableCategory.UPPER_BODY,
    rarity: 'common',
    transferredAt: 1234567890,
    price: 100,
    individualData: [], // This will be reconstructed by the grouping logic
    amount: 1, // This will be recalculated by the grouping logic
    minTransferredAt: 1234567890, // This will be recalculated by the grouping logic
    maxTransferredAt: 1234567890 // This will be recalculated by the grouping logic
  }
}

export function createMockProfileEmote(): ProfileEmote {
  return {
    id: 'mock-emote-id',
    urn: 'urn:decentraland:matic:collections-v2:0xmock:emote',
    tokenId: '1',
    name: 'Mock Emote',
    category: EmoteCategory.DANCE,
    rarity: 'rare',
    transferredAt: 1234567890,
    price: 200,
    individualData: [], // This will be reconstructed by the grouping logic
    amount: 1, // This will be recalculated by the grouping logic
    minTransferredAt: 1234567890, // This will be recalculated by the grouping logic
    maxTransferredAt: 1234567890 // This will be recalculated by the grouping logic
  }
}

export function createMockProfileName(): ProfileName {
  return {
    name: 'mockname.dcl.eth',
    contractAddress: '0xmock',
    tokenId: '1',
    price: 500
  }
}
