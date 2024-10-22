import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'
import { ThirdPartyProvider } from '../types'
import { Rarity } from '@dcl/schemas'

export const SORTED_RARITIES = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.LEGENDARY,
  Rarity.EXOTIC,
  Rarity.MYTHIC,
  Rarity.UNIQUE
]

export async function parseUrn(urn: string) {
  try {
    return await resolverParseUrn(urn)
  } catch (err: any) {
    return null
  }
}

export function splitUrnAndTokenId(urnReceived: string) {
  const urnLength = urnReceived.split(':').length

  if (urnLength === 7 && !urnReceived.includes('collections-thirdparty')) {
    const lastColonIndex = urnReceived.lastIndexOf(':')
    const urnValue = urnReceived.slice(0, lastColonIndex)
    return { urn: urnValue, tokenId: urnReceived.slice(lastColonIndex + 1) }
  } else {
    return { urn: urnReceived, tokenId: undefined }
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

export function sanitizeContractList(thirdPartyProviders: ThirdPartyProvider[]) {
  for (const thirdParty of thirdPartyProviders) {
    if (thirdParty.metadata.thirdParty?.contracts) {
      thirdParty.metadata.thirdParty.contracts = thirdParty.metadata.thirdParty.contracts.map((c) => ({
        network: c.network.toLowerCase(),
        address: c.address.toLowerCase()
      }))
    }
  }
}
