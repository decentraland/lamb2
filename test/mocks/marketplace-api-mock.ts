import { WearableCategory, EmoteCategory } from '@dcl/schemas'
import { MarketplaceApiFetcher, MarketplaceApiParams } from '../../src/adapters/marketplace-api-fetcher'
import { WearableFromQuery, EmoteFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { NameFromQuery } from '../../src/logic/fetch-elements/fetch-names'
import { OnChainWearable, OnChainEmote, Name } from '../../src/types'

export interface MarketplaceApiMockConfig {
  wearables?: WearableFromQuery[]
  emotes?: EmoteFromQuery[]
  names?: NameFromQuery[]
  shouldFail?: boolean
}

export function createMarketplaceApiFetcherMock(config: MarketplaceApiMockConfig = {}): MarketplaceApiFetcher {
  const { wearables = [], emotes = [], names = [], shouldFail = false } = config

  return {
    start: async () => {},
    stop: async () => {},

    async fetchUserWearables(address: string, params?: MarketplaceApiParams) {
      if (shouldFail) {
        throw new Error('Marketplace API mock failure')
      }

      // Convert WearableFromQuery to OnChainWearable format
      let result = wearables.map(
        (w): OnChainWearable => ({
          urn: w.urn,
          amount: 1,
          individualData: [
            {
              id: `${w.urn}:${w.tokenId}`,
              tokenId: w.tokenId,
              transferredAt: w.transferredAt,
              price: w.item.price
            }
          ],
          name: w.metadata.wearable.name,
          rarity: w.item.rarity,
          minTransferredAt: w.transferredAt,
          maxTransferredAt: w.transferredAt,
          category: w.metadata.wearable.category
        })
      )

      // Apply filters
      if (params?.name) {
        result = result.filter((w) => w.name.includes(params.name!))
      }
      if (params?.category) {
        const categories = Array.isArray(params.category) ? params.category : [params.category]
        result = result.filter((w) => categories.includes(w.category))
      }
      if (params?.rarity) {
        const rarities = Array.isArray(params.rarity) ? params.rarity : [params.rarity]
        result = result.filter((w) => rarities.includes(w.rarity))
      }

      // Apply sorting
      if (params?.orderBy) {
        if (params.orderBy === 'name') {
          result.sort((a, b) => {
            const comparison = a.name.localeCompare(b.name)
            return params.direction === 'DESC' ? -comparison : comparison
          })
        } else if (params.orderBy === 'date') {
          result.sort((a, b) => {
            const comparison = a.minTransferredAt - b.minTransferredAt
            return params.direction === 'DESC' ? -comparison : comparison
          })
        } else if (params.orderBy === 'rarity') {
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']
          result.sort((a, b) => {
            const aIndex = rarityOrder.indexOf(a.rarity)
            const bIndex = rarityOrder.indexOf(b.rarity)
            const comparison = bIndex - aIndex // rarest first by default
            return params.direction === 'ASC' ? -comparison : comparison
          })
        }
      } else {
        // Default sorting by rarity (rarest first)
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']
        result.sort((a, b) => {
          const aIndex = rarityOrder.indexOf(a.rarity)
          const bIndex = rarityOrder.indexOf(b.rarity)
          return bIndex - aIndex
        })
      }

      // Apply pagination
      const total = result.length
      if (params?.limit && params?.offset !== undefined) {
        result = result.slice(params.offset, params.offset + params.limit)
      }

      return {
        wearables: result,
        total
      }
    },

    async fetchUserEmotes(address: string, params?: MarketplaceApiParams) {
      if (shouldFail) {
        throw new Error('Marketplace API mock failure')
      }

      // Convert EmoteFromQuery to OnChainEmote format
      let result = emotes.map(
        (e): OnChainEmote => ({
          urn: e.urn,
          amount: 1,
          individualData: [
            {
              id: `${e.urn}:${e.tokenId}`,
              tokenId: e.tokenId,
              transferredAt: e.transferredAt,
              price: e.item.price
            }
          ],
          name: e.metadata.emote.name,
          rarity: e.item.rarity,
          minTransferredAt: e.transferredAt,
          maxTransferredAt: e.transferredAt,
          category: e.metadata.emote.category
        })
      )

      // Apply filters (similar to wearables)
      if (params?.name) {
        result = result.filter((e) => e.name.includes(params.name!))
      }
      if (params?.category) {
        const categories = Array.isArray(params.category) ? params.category : [params.category]
        result = result.filter((e) => categories.includes(e.category))
      }
      if (params?.rarity) {
        const rarities = Array.isArray(params.rarity) ? params.rarity : [params.rarity]
        result = result.filter((e) => rarities.includes(e.rarity))
      }

      // Apply pagination
      const total = result.length
      if (params?.limit && params?.offset !== undefined) {
        result = result.slice(params.offset, params.offset + params.limit)
      }

      return {
        emotes: result,
        total
      }
    },

    async fetchUserNames(address: string, params?: MarketplaceApiParams) {
      if (shouldFail) {
        throw new Error('Marketplace API mock failure')
      }

      // Convert NameFromQuery to Name format
      let result = names.map(
        (n): Name => ({
          name: n.name,
          contractAddress: n.contractAddress,
          tokenId: n.tokenId,
          price: n.activeOrder?.price
        })
      )

      // Apply filters
      if (params?.name) {
        result = result.filter((n) => n.name.includes(params.name!))
      }

      // Apply pagination
      const total = result.length
      if (params?.limit && params?.offset !== undefined) {
        result = result.slice(params.offset, params.offset + params.limit)
      }

      return {
        names: result,
        total
      }
    }
  }
}
