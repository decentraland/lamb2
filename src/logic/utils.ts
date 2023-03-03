import { CachedWearable } from '../types'

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

export function compareByRarity(wearable1: CachedWearable, wearable2: CachedWearable) {
  const w1RarityValue = RARITIES.findIndex((rarity) => rarity === wearable1.rarity)
  const w2RarityValue = RARITIES.findIndex((rarity) => rarity === wearable2.rarity)
  return w2RarityValue - w1RarityValue
}

export function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}
