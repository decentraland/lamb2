import { IPgComponent } from '@well-known-components/pg-component'
import { EmoteCategory, WearableCategory } from '@dcl/schemas'

export interface IDappsDbComponent extends IPgComponent {
  /**
   * Gets complete wearable data for a user
   * Returns full wearable information including metadata, rarity, pricing, etc.
   */
  getWearablesByOwner(owner: string, limit?: number): Promise<ProfileWearable[]>

  /**
   * Gets minimal wearable data for profile validation - used by profiles endpoint
   * Returns only URN and token ID for efficient wearable ownership validation
   */
  getOwnedWearablesUrnAndTokenId(owner: string, limit?: number): Promise<{ urn: string; tokenId: string }[]>

  /**
   * Gets complete emote data for a user
   * Returns full emote information including metadata, rarity, pricing, etc.
   */
  getEmotesByOwner(owner: string, limit?: number): Promise<ProfileEmote[]>

  /**
   * Gets minimal emote data for profile validation - used by profiles endpoint
   * Returns only URN and token ID for efficient emote ownership validation
   */
  getOwnedEmotesUrnAndTokenId(owner: string, limit?: number): Promise<{ urn: string; tokenId: string }[]>

  /**
   * Gets complete name/ENS data for a user
   * Returns full name information including contract details and pricing
   */
  getNamesByOwner(owner: string, limit?: number): Promise<ProfileName[]>

  /**
   * Gets minimal name data for profile validation
   * Returns only the name/subdomain for efficient name ownership validation
   */
  getOwnedNamesOnly(owner: string, limit?: number): Promise<{ name: string }[]>
}

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

export type DappsDbRow = {
  id: string
  contract_address: string
  token_id: string
  network: string
  created_at: string
  updated_at: string
  sold_at?: string
  urn: string
  owner: string
  image?: string
  issued_id?: string
  item_id?: string
  category: string
  rarity?: string
  name?: string
  item_type?: string
  transferred_at?: number
  price?: number
}
