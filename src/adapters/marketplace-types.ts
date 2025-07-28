import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { OnChainWearable, OnChainEmote, Item } from '../types'
import { compareByRarity } from '../logic/sorting'

export type ProfileWearable = {
  urn: string
  id: string
  tokenId: string
  category: WearableCategory
  transferredAt: string
  name: string
  rarity: string
  price?: string
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: string
    price: string
  }>
  amount: number
  minTransferredAt: number
  maxTransferredAt: number
}

export type ProfileEmote = {
  urn: string
  id: string
  tokenId: string
  category: EmoteCategory
  transferredAt: number
  name: string
  rarity: string
  price?: string
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: string
    price: string
  }>
  amount: number
  minTransferredAt: number
  maxTransferredAt: number
}

export type ProfileName = {
  name: string
  contractAddress: string
  tokenId: string
  price?: string
}

/**
 * Groups marketplace-api profile items by URN and constructs individualData
 * Similar to groupItemsByURN in fetch-items.ts but for marketplace-api data
 */
function groupProfileItemsByURN<
  T extends ProfileWearable | ProfileEmote,
  TCategory extends WearableCategory | EmoteCategory
>(profileItems: T[]): Item<TCategory>[] {
  const itemsByURN = new Map<string, Item<TCategory>>()

  profileItems.forEach((profileItem) => {
    const individualData = {
      id: profileItem.urn + ':' + profileItem.tokenId,
      tokenId: profileItem.tokenId,
      transferredAt: String(profileItem.transferredAt),
      price: String(profileItem.price || 0)
    }

    if (itemsByURN.has(profileItem.urn)) {
      const itemFromMap = itemsByURN.get(profileItem.urn)!
      itemFromMap.individualData.push(individualData)
      itemFromMap.amount = itemFromMap.amount + 1
      itemFromMap.minTransferredAt = Math.min(Number(profileItem.transferredAt), Number(itemFromMap.minTransferredAt))
      itemFromMap.maxTransferredAt = Math.max(Number(profileItem.transferredAt), Number(itemFromMap.maxTransferredAt))
    } else {
      itemsByURN.set(profileItem.urn, {
        urn: profileItem.urn,
        individualData: [individualData],
        rarity: profileItem.rarity,
        amount: 1,
        name: profileItem.name,
        category: profileItem.category as TCategory,
        minTransferredAt: Number(profileItem.transferredAt),
        maxTransferredAt: Number(profileItem.transferredAt)
      })
    }
  })

  return Array.from(itemsByURN.values())
}

// Mappers to convert from Profile types to OnChain types with proper URN grouping
export function fromProfileWearablesToOnChainWearables(profileWearables: ProfileWearable[]): OnChainWearable[] {
  const groupedItems = groupProfileItemsByURN<ProfileWearable, WearableCategory>(profileWearables)
  return groupedItems.sort(compareByRarity) as OnChainWearable[]
}

export function fromProfileEmotesToOnChainEmotes(profileEmotes: ProfileEmote[]): OnChainEmote[] {
  const groupedItems = groupProfileItemsByURN<ProfileEmote, EmoteCategory>(profileEmotes)
  return groupedItems.sort(compareByRarity) as OnChainEmote[]
}
