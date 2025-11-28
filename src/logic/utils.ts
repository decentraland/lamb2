import { parseUrn as resolverParseUrn } from '@dcl/urn-resolver'
import { ItemType, ThirdPartyProvider, MixedWearable } from '../types'
import { Rarity, WearableCategory } from '@dcl/schemas'

export type ExplorerWearableRepresentation = {
  bodyShapes: string[]
}

export type ExplorerWearableMetadata = {
  id: string
  rarity?: Rarity
  isSmart?: boolean
  data: {
    category: WearableCategory
    representations: ExplorerWearableRepresentation[]
  }
}

export type ExplorerWearableEntity = {
  id: string
  thumbnail?: string
  metadata: ExplorerWearableMetadata
  individualData: MixedWearable['individualData']
}

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

export function buildTrimmedEntity({ entity, itemType, individualData }: MixedWearable): ExplorerWearableEntity {
  const thumbnailFile = entity?.metadata?.thumbnail as string | undefined
  const thumbnailHash = entity?.content?.find((c) => c.file === thumbnailFile)?.hash
  const metadata = entity?.metadata
  const category: WearableCategory | undefined = metadata?.data?.category
  const representations: ExplorerWearableRepresentation[] = (metadata?.data?.representations || []).map((rep: any) => ({
    bodyShapes: rep.bodyShapes
  }))
  const isSmart = itemType === ItemType.SMART_WEARABLE_V1

  return {
    id: entity.id,
    thumbnail: thumbnailHash,
    individualData,
    metadata: {
      id: metadata?.id,
      rarity: metadata?.rarity,
      isSmart,
      data: {
        category: category as WearableCategory,
        representations
      }
    }
  }
}
