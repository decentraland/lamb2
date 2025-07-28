import { IMarketplaceApiFetcher } from '../../src/adapters/marketplace-api-fetcher'
import { ProfileName } from '../../src/adapters/marketplace-types'
import { OnChainWearable, OnChainEmote } from '../../src/types'
import { WearableCategory, EmoteCategory } from '@dcl/schemas'

export function createMarketplaceApiMock(): IMarketplaceApiFetcher {
  return {
    // Main methods now return grouped data by default
    async getWearablesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: OnChainWearable[]; total: number }> {
      return {
        data: [
          {
            urn: 'urn:decentraland:matic:collections-v2:0x123:0',
            amount: 2,
            individualData: [
              {
                id: 'urn:decentraland:matic:collections-v2:0x123:0:1',
                tokenId: '1',
                transferredAt: '1640995200',
                price: '100'
              },
              {
                id: 'urn:decentraland:matic:collections-v2:0x123:0:2',
                tokenId: '2',
                transferredAt: '1641081600',
                price: '150'
              }
            ],
            name: 'Cool Wearable',
            rarity: 'common',
            minTransferredAt: 1640995200,
            maxTransferredAt: 1641081600,
            category: WearableCategory.EYEWEAR
          }
        ],
        total: 1
      }
    },

    async getEmotesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: OnChainEmote[]; total: number }> {
      return {
        data: [
          {
            urn: 'urn:decentraland:matic:collections-v2:0x456:0',
            amount: 1,
            individualData: [
              {
                id: 'urn:decentraland:matic:collections-v2:0x456:0:1',
                tokenId: '1',
                transferredAt: '1640995200',
                price: '200'
              }
            ],
            name: 'Cool Emote',
            rarity: 'rare',
            minTransferredAt: 1640995200,
            maxTransferredAt: 1640995200,
            category: EmoteCategory.DANCE
          }
        ],
        total: 1
      }
    },

    async getNamesByOwner(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: ProfileName[]; total: number; totalItems: number }> {
      return {
        data: [createMockProfileName()],
        total: 1,
        totalItems: 1
      }
    },

    async getOwnedWearablesUrnAndTokenId(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      return {
        data: [{ urn: 'urn:decentraland:matic:collections-v2:0x123:0', tokenId: '1' }],
        total: 1,
        totalItems: 1
      }
    },

    async getOwnedEmotesUrnAndTokenId(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: Array<{ urn: string; tokenId: string }>; total: number; totalItems: number }> {
      return {
        data: [{ urn: 'urn:decentraland:matic:collections-v2:0x456:0', tokenId: '1' }],
        total: 1,
        totalItems: 1
      }
    },

    async getOwnedNamesOnly(
      _address: string,
      _first = 1000,
      _skip = 0
    ): Promise<{ data: string[]; total: number; totalItems: number }> {
      return {
        data: ['test.dcl.eth'],
        total: 1,
        totalItems: 1
      }
    },

    // Methods to fetch ALL results automatically with pagination - now return grouped data
    async getAllWearablesByOwner(_address: string): Promise<OnChainWearable[]> {
      return [
        {
          urn: 'urn:decentraland:matic:collections-v2:0x123:0',
          amount: 2,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections-v2:0x123:0:1',
              tokenId: '1',
              transferredAt: '1640995200',
              price: '100'
            },
            {
              id: 'urn:decentraland:matic:collections-v2:0x123:0:2',
              tokenId: '2',
              transferredAt: '1641081600',
              price: '150'
            }
          ],
          name: 'Cool Wearable',
          rarity: 'common',
          minTransferredAt: 1640995200,
          maxTransferredAt: 1641081600,
          category: WearableCategory.EYEWEAR
        }
      ]
    },

    async getAllEmotesByOwner(_address: string): Promise<OnChainEmote[]> {
      return [
        {
          urn: 'urn:decentraland:matic:collections-v2:0x456:0',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections-v2:0x456:0:1',
              tokenId: '1',
              transferredAt: '1640995200',
              price: '200'
            }
          ],
          name: 'Cool Emote',
          rarity: 'rare',
          minTransferredAt: 1640995200,
          maxTransferredAt: 1640995200,
          category: EmoteCategory.DANCE
        }
      ]
    },

    async getAllNamesByOwner(_address: string): Promise<ProfileName[]> {
      return [createMockProfileName()]
    }
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
