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

export function resolveUrn(urnString: string) {
  const urnLength = urnString.split(':').length

  if (urnLength === 7) {
    const lastColonIndex = urnString.lastIndexOf(':')
    const urnValue = urnString.slice(0, lastColonIndex)
    return { urn: urnValue, tokenId: urnString.slice(lastColonIndex + 1) }
  } else {
    return { urn: urnString, tokenId: undefined }
  }
}

export function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}
