import { Wearable } from '../types'
import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

// TODO: when deprecated old wearables handle, move this function to fetch-items.ts
export function compareByRarity(wearable1: Wearable, wearable2: Wearable) {
  const w1RarityValue = RARITIES.findIndex((rarity) => rarity === wearable1.rarity)
  const w2RarityValue = RARITIES.findIndex((rarity) => rarity === wearable2.rarity)
  return w2RarityValue - w1RarityValue
}

export async function parseUrn(urn: string) {
  try {
    return await resolverParseUrn(urn)
  } catch (err: any) {
    return null
  }
}

export async function findAsync<T>(elements: T[], f: (e: T) => Promise<boolean>): Promise<T | undefined> {
  for (const e of elements) {
    if (await f(e)) {
      return e
    }
  }

  return undefined
}
