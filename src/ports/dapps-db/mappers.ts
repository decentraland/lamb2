import { EmoteCategory, Rarity, WearableCategory } from '@dcl/schemas'
import { ProfileWearable, ProfileEmote, ProfileName, DappsDbRow } from './types'
import { OnChainWearable, OnChainEmote } from '../../types'

export function fromDbRowsToWearables(rows: DappsDbRow[]): ProfileWearable[] {
  // Group by URN to aggregate individual tokens
  const wearablesByUrn = new Map<string, ProfileWearable>()

  rows.forEach((row) => {
    const transferredAt = new Date(row.transferred_at || row.created_at).getTime()

    const individualData = {
      id: row.id,
      tokenId: row.token_id,
      transferredAt,
      price: row.price || 0
    }

    if (wearablesByUrn.has(row.urn)) {
      const wearable = wearablesByUrn.get(row.urn)!
      wearable.individualData.push(individualData)
      wearable.amount += 1
      wearable.minTransferredAt = Math.min(transferredAt, wearable.minTransferredAt)
      wearable.maxTransferredAt = Math.max(transferredAt, wearable.maxTransferredAt)
    } else {
      wearablesByUrn.set(row.urn, {
        urn: row.urn,
        id: row.id,
        tokenId: row.token_id,
        category: (row.category as WearableCategory) || WearableCategory.EYEWEAR,
        transferredAt,
        name: row.name || '',
        rarity: row.rarity || Rarity.COMMON,
        price: row.price,
        individualData: [individualData],
        amount: 1,
        minTransferredAt: transferredAt,
        maxTransferredAt: transferredAt
      })
    }
  })

  return Array.from(wearablesByUrn.values())
}

export function fromDbRowsToEmotes(rows: DappsDbRow[]): ProfileEmote[] {
  // Group by URN to aggregate individual tokens
  const emotesByUrn = new Map<string, ProfileEmote>()

  rows.forEach((row) => {
    const transferredAt = new Date(row.transferred_at || row.created_at).getTime()

    const individualData = {
      id: row.id,
      tokenId: row.token_id,
      transferredAt,
      price: row.price || 0
    }

    if (emotesByUrn.has(row.urn)) {
      const emote = emotesByUrn.get(row.urn)!
      emote.individualData.push(individualData)
      emote.amount += 1
      emote.minTransferredAt = Math.min(transferredAt, emote.minTransferredAt)
      emote.maxTransferredAt = Math.max(transferredAt, emote.maxTransferredAt)
    } else {
      emotesByUrn.set(row.urn, {
        urn: row.urn,
        id: row.id,
        tokenId: row.token_id,
        category: (row.category as EmoteCategory) || EmoteCategory.DANCE,
        transferredAt,
        name: row.name || '',
        rarity: row.rarity || Rarity.COMMON,
        price: row.price,
        individualData: [individualData],
        amount: 1,
        minTransferredAt: transferredAt,
        maxTransferredAt: transferredAt
      })
    }
  })

  return Array.from(emotesByUrn.values())
}

export function fromDbRowsToNames(rows: DappsDbRow[]): ProfileName[] {
  return rows.map((row) => ({
    name: row.name || '',
    contractAddress: row.contract_address,
    tokenId: row.token_id,
    price: row.price
  }))
}

// Mappers to convert from Profile types to OnChain types for endpoints
export function fromProfileWearablesToOnChainWearables(profileWearables: ProfileWearable[]): OnChainWearable[] {
  return profileWearables.map((profileWearable) => ({
    urn: profileWearable.urn,
    amount: profileWearable.amount,
    individualData: profileWearable.individualData,
    name: profileWearable.name,
    rarity: profileWearable.rarity,
    minTransferredAt: profileWearable.minTransferredAt,
    maxTransferredAt: profileWearable.maxTransferredAt,
    category: profileWearable.category
  }))
}

export function fromProfileEmotesToOnChainEmotes(profileEmotes: ProfileEmote[]): OnChainEmote[] {
  return profileEmotes.map((profileEmote) => ({
    urn: profileEmote.urn,
    amount: profileEmote.amount,
    individualData: profileEmote.individualData,
    name: profileEmote.name,
    rarity: profileEmote.rarity,
    minTransferredAt: profileEmote.minTransferredAt,
    maxTransferredAt: profileEmote.maxTransferredAt,
    category: profileEmote.category
  }))
}
