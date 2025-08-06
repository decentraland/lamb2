import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import { OnChainWearable, OnChainEmote } from '../types'

export type ProfileWearable = {
  urn: string
  id: string
  tokenId: string
  category: WearableCategory
  transferredAt: number
  name: string
  rarity: string
  price?: number
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: number
    price: number
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
  price?: number
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: number
    price: number
  }>
  amount: number
  minTransferredAt: number
  maxTransferredAt: number
}

export type ProfileName = {
  name: string
  contractAddress: string
  tokenId: string
  price?: number
}

// Base interface for the common properties between Profile and OnChain types
interface ProfileToOnChainMappable {
  urn: string
  amount: number
  individualData: Array<{
    id: string
    tokenId: string
    transferredAt: number
    price: number
  }>
  name: string
  rarity: string
  minTransferredAt: number
  maxTransferredAt: number
  category: string
}

// Generic mapper function to convert Profile types to OnChain types
function fromProfileToOnChain<TProfile extends ProfileToOnChainMappable, TOnChain>(
  profileItems: TProfile[]
): TOnChain[] {
  return profileItems.map((profileItem) => ({
    urn: profileItem.urn,
    amount: profileItem.amount,
    individualData: profileItem.individualData,
    name: profileItem.name,
    rarity: profileItem.rarity,
    minTransferredAt: profileItem.minTransferredAt,
    maxTransferredAt: profileItem.maxTransferredAt,
    category: profileItem.category
  })) as TOnChain[]
}

// Mappers to convert from Profile types to OnChain types for endpoints
export function fromProfileWearablesToOnChainWearables(profileWearables: ProfileWearable[]): OnChainWearable[] {
  return fromProfileToOnChain<ProfileWearable, OnChainWearable>(profileWearables)
}

export function fromProfileEmotesToOnChainEmotes(profileEmotes: ProfileEmote[]): OnChainEmote[] {
  return fromProfileToOnChain<ProfileEmote, OnChainEmote>(profileEmotes)
}
