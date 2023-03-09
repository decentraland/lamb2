import { Pagination, Wearable } from '../types'
import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'

export function paginationObject(url: URL): Pagination {
  const pageSize = url.searchParams.has('pageSize') ? parseInt(url.searchParams.get('pageSize')!, 10) : 100
  const pageNum = url.searchParams.has('pageNum') ? parseInt(url.searchParams.get('pageNum')!, 10) : 1

  const offset = (pageNum - 1) * pageSize
  const limit = pageSize
  return { pageSize, pageNum, offset, limit }
}

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

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
