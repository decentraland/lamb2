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

export const resolveUrn = (urnString: string) => {
  const lastColonIndex = urnString.lastIndexOf(':')
  const urnValue = urnString.slice(0, lastColonIndex)
  return { urn: urnValue, tokenId: urnString.slice(lastColonIndex + 1) }
}

// Check if the entity's timestamp is older than the release date timestamp
// If the entity's timestamp is older than the release date timestamp, we need to extend the urns with the tokenIds
export function isOlderThanReleaseDate(timestamp: number) {
  const EXTENDED_URN_RELEASE_DATE_TIMESTAMP = 1691564848 * 1000 // Wed Aug 09 2023 07:07:28 GMT+0000
  return timestamp < EXTENDED_URN_RELEASE_DATE_TIMESTAMP
}
