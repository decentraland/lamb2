import { OnChainWearable, OnChainEmote, Name } from '../../types'
import { ProfileWearable, ProfileEmote, ProfileName } from '../../ports/dapps-db/types'

export function fromDbRowsToWearables(profileWearables: ProfileWearable[]): OnChainWearable[] {
  return profileWearables.map((wearable) => ({
    urn: wearable.urn,
    amount: wearable.amount,
    name: wearable.name,
    rarity: wearable.rarity,
    category: wearable.category,
    individualData: wearable.individualData.map((data) => ({
      id: data.id,
      tokenId: data.tokenId,
      transferredAt: data.transferredAt,
      price: data.price
    })),
    definition: null,
    minTransferredAt: wearable.minTransferredAt,
    maxTransferredAt: wearable.maxTransferredAt
  }))
}

export function fromDbRowsToEmotes(profileEmotes: ProfileEmote[]): OnChainEmote[] {
  return profileEmotes.map((emote) => ({
    urn: emote.urn,
    amount: emote.amount,
    name: emote.name,
    rarity: emote.rarity,
    category: emote.category,
    individualData: emote.individualData.map((data) => ({
      id: data.id,
      tokenId: data.tokenId,
      transferredAt: data.transferredAt,
      price: data.price
    })),
    definition: null,
    minTransferredAt: emote.minTransferredAt,
    maxTransferredAt: emote.maxTransferredAt
  }))
}

export function fromDbRowsToNames(profileNames: ProfileName[]): Name[] {
  return profileNames.map((name) => ({
    name: name.name,
    contractAddress: name.contractAddress,
    tokenId: name.tokenId
  }))
}
