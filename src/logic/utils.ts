import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

// TODO: when deprecated old wearables handle, move this function to fetch-items.ts
export function compareByRarity<T extends { rarity: string }>(item1: T, item2: T) {
  const w1RarityValue = RARITIES.findIndex((rarity) => rarity === item1.rarity)
  const w2RarityValue = RARITIES.findIndex((rarity) => rarity === item2.rarity)
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
