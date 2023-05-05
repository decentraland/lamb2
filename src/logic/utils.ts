import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

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
