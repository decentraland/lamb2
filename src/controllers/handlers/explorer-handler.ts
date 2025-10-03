import { Entity, WearableCategory } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createUniversalSorting } from '../../logic/sorting'
import { parseUrn } from '../../logic/utils'
import {
  AppComponents,
  BaseWearable,
  HandlerContextWithPath,
  InvalidRequestError,
  OnChainWearable,
  PaginatedResponse,
  ThirdPartyWearable,
  ExplorerWearableRepresentation,
  ExplorerWearableEntity
} from '../../types'
import { createFilters } from './items-commons'
import { BASE_WEARABLE, ON_CHAIN, THIRD_PARTY } from '../../constants'

const VALID_COLLECTION_TYPES = [BASE_WEARABLE, ON_CHAIN, THIRD_PARTY]

export type MixedBaseWearable = BaseWearable & {
  type: typeof BASE_WEARABLE
  entity: Entity
}

export type MixedOnChainWearable = OnChainWearable & {
  type: typeof ON_CHAIN
  entity: Entity
}

export type MixedThirdPartyWearable = ThirdPartyWearable & {
  type: typeof THIRD_PARTY
}

export type MixedWearable = (MixedBaseWearable | MixedOnChainWearable | MixedThirdPartyWearable) &
  Partial<Pick<OnChainWearable, 'rarity'>>

export type MixedBaseWearableTrimmed = Omit<MixedBaseWearable, 'entity'> & {
  type: typeof BASE_WEARABLE
  entity: ExplorerWearableEntity
}

export type MixedOnChainWearableTrimmed = Omit<MixedOnChainWearable, 'entity'> & {
  type: typeof ON_CHAIN
  entity: ExplorerWearableEntity
}

export type MixedThirdPartyWearableTrimmed = Omit<MixedThirdPartyWearable, 'entity'> & {
  type: typeof THIRD_PARTY
  entity: ExplorerWearableEntity
}

// Union types to handle both Entity and ExplorerWearableEntity
export type MixedBaseWearableUnion = Omit<MixedBaseWearable, 'entity'> & {
  type: typeof BASE_WEARABLE
  entity: Entity | ExplorerWearableEntity
}

export type MixedOnChainWearableUnion = Omit<MixedOnChainWearable, 'entity'> & {
  type: typeof ON_CHAIN
  entity: Entity | ExplorerWearableEntity
}

export type MixedThirdPartyWearableUnion = Omit<MixedThirdPartyWearable, 'entity'> & {
  type: typeof THIRD_PARTY
  entity: Entity | ExplorerWearableEntity
}

export type MixedWearableUnion = (MixedBaseWearableUnion | MixedOnChainWearableUnion | MixedThirdPartyWearableUnion) &
  Partial<Pick<OnChainWearable, 'rarity'>>

// Response types that can handle both cases
export type MixedWearableUnionResponse = Omit<MixedWearableUnion, 'minTransferredAt' | 'maxTransferredAt'>

// Trimmed response types (only type and entity)
export type MixedBaseWearableTrimmedResponse = {
  type: typeof BASE_WEARABLE
  entity: ExplorerWearableEntity
}

export type MixedOnChainWearableTrimmedResponse = {
  type: typeof ON_CHAIN
  entity: ExplorerWearableEntity
}

export type MixedThirdPartyWearableTrimmedResponse = {
  type: typeof THIRD_PARTY
  entity: ExplorerWearableEntity
}

export type MixedWearableTrimmedResponse =
  | MixedBaseWearableTrimmedResponse
  | MixedOnChainWearableTrimmedResponse
  | MixedThirdPartyWearableTrimmedResponse

// Combined response type that can handle both trimmed and non-trimmed cases
export type MixedWearableResponse = MixedWearableUnionResponse | MixedWearableTrimmedResponse

export function buildExplorerEntity(entity: Entity): ExplorerWearableEntity {
  const thumbnailFile = entity?.metadata?.thumbnail as string | undefined
  const thumbnailHash = entity?.content?.find((c) => c.file === thumbnailFile)?.hash
  const metadata = entity?.metadata
  const category: WearableCategory | undefined = metadata?.data?.category
  const representations: ExplorerWearableRepresentation[] = (metadata?.data?.representations || []).map((rep: any) => ({
    bodyShapes: rep.bodyShapes
  }))

  return {
    id: entity.id,
    thumbnail: thumbnailHash,
    metadata: {
      id: metadata?.id,
      rarity: metadata?.rarity,
      data: {
        category: category as WearableCategory,
        representations
      }
    }
  }
}

async function fetchCombinedElements(
  components: Pick<
    AppComponents,
    | 'fetch'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'entitiesFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'thirdPartyProvidersStorage'
  >,
  collectionTypes: string[],
  thirdPartyCollectionId: string[],
  address: string,
  isTrimmed: boolean = false
): Promise<MixedWearableResponse[]> {
  async function fetchBaseWearables(): Promise<MixedWearableResponse[]> {
    const elements = await components.baseWearablesFetcher.fetchOwnedElements(address)
    if (!elements.length) {
      return []
    }

    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    return elements.reduce<MixedWearableResponse[]>((acc, wearable, i) => {
      const entity = entities[i]
      if (entity) {
        if (isTrimmed) {
          acc.push({
            type: BASE_WEARABLE,
            entity: buildExplorerEntity(entity)
          } as MixedWearableResponse)
        } else {
          acc.push({
            type: BASE_WEARABLE,
            ...wearable,
            entity: entity
          } as MixedWearableResponse)
        }
      }
      return acc
    }, [])
  }

  async function fetchOnChainWearables(): Promise<MixedWearableResponse[]> {
    const elements = await components.wearablesFetcher.fetchOwnedElements(address)
    if (!elements.length) {
      return []
    }

    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    return elements.reduce<MixedWearableResponse[]>((acc, wearable, i) => {
      const entity = entities[i]
      if (entity) {
        if (isTrimmed) {
          acc.push({
            type: ON_CHAIN,
            entity: buildExplorerEntity(entity)
          } as MixedWearableResponse)
        } else {
          acc.push({
            type: ON_CHAIN,
            ...wearable,
            entity: entity
          } as MixedWearableResponse)
        }
      }
      return acc
    }, [])
  }

  async function fetchThirdPartyWearables(thirdPartyCollectionIds: string[]): Promise<MixedWearableResponse[]> {
    if (thirdPartyCollectionIds.length === 0) {
      const elements = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)

      return elements.map((wearable: ThirdPartyWearable): MixedWearableResponse => {
        if (isTrimmed) {
          return {
            type: THIRD_PARTY,
            entity: buildExplorerEntity(wearable.entity)
          } as MixedWearableResponse
        } else {
          return {
            type: THIRD_PARTY,
            ...wearable,
            entity: wearable.entity
          } as MixedWearableResponse
        }
      })
    }

    const uniqueCollectionIds = Array.from(new Set(thirdPartyCollectionIds))

    const validUrns = await Promise.all(
      uniqueCollectionIds.map(async (collectionId) => {
        const collectionIdCleaned = collectionId.split(':').slice(0, 5).join(':')
        const urn = await parseUrn(collectionIdCleaned)
        return urn && urn.type === 'blockchain-collection-third-party-name' ? urn : null
      })
    )

    const filteredUrns = validUrns.filter((urn): urn is NonNullable<typeof urn> => urn !== null)

    const allWearables = await Promise.all(
      filteredUrns.map((urn) => fetchThirdPartyWearablesFromThirdPartyName(components, address, urn))
    )

    return allWearables.flat().map((wearable: ThirdPartyWearable): MixedWearableResponse => {
      if (isTrimmed) {
        return {
          type: THIRD_PARTY,
          entity: buildExplorerEntity(wearable.entity)
        } as MixedWearableResponse
      } else {
        return {
          type: THIRD_PARTY,
          ...wearable,
          entity: wearable.entity
        } as MixedWearableResponse
      }
    })
  }

  const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
    collectionTypes.includes(BASE_WEARABLE) ? fetchBaseWearables() : [],
    collectionTypes.includes(ON_CHAIN) ? fetchOnChainWearables() : [],
    collectionTypes.includes(THIRD_PARTY) ? fetchThirdPartyWearables(thirdPartyCollectionId) : []
  ])

  return [...baseItems, ...nftItems, ...thirdPartyItems]
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'fetch'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'entitiesFetcher'
    | 'thirdPartyProvidersStorage',
    '/explorer/:address/wearables'
  >
): Promise<PaginatedResponse<MixedWearableResponse>> {
  const { address } = context.params
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createUniversalSorting(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : VALID_COLLECTION_TYPES
  const thirdPartyCollectionIds = context.url.searchParams.has('thirdPartyCollectionId')
    ? context.url.searchParams.getAll('thirdPartyCollectionId')
    : []
  const trimmedParam = context.url.searchParams.get('trimmed')
  const isTrimmed = trimmedParam === 'true' || trimmedParam === '1'

  if (collectionTypes.some((type) => !VALID_COLLECTION_TYPES.includes(type))) {
    throw new InvalidRequestError(`Invalid collection type. Valid types are: ${VALID_COLLECTION_TYPES.join(', ')}.`)
  }

  const page = await fetchAndPaginate<MixedWearableResponse>(
    () => fetchCombinedElements(context.components, collectionTypes, thirdPartyCollectionIds, address, isTrimmed),
    pagination,
    filter,
    sorting
  )
  const results: MixedWearableResponse[] = []
  for (const wearable of page.elements) {
    if (isTrimmed) {
      // For trimmed responses, return only the ExplorerWearableEntity
      results.push(wearable)
    } else if (wearable.type === ON_CHAIN && 'minTransferredAt' in wearable && 'maxTransferredAt' in wearable) {
      // For non-trimmed ON_CHAIN wearables, remove minTransferredAt/maxTransferredAt
      const { minTransferredAt, maxTransferredAt, ...clean } = wearable
      results.push({ ...clean })
    } else {
      // For non-trimmed other wearables, return as-is
      results.push(wearable)
    }
  }

  return {
    status: 200,
    body: {
      ...page,
      elements: results
    }
  }
}
