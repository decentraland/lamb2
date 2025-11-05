import { Entity } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createCombinedSorting } from '../../logic/sorting'
import { ExplorerWearableEntity, parseUrn, buildTrimmedEntity } from '../../logic/utils'
import {
  AppComponents,
  BaseWearable,
  HandlerContextWithPath,
  InvalidRequestError,
  OnChainWearable,
  PaginatedResponse,
  ThirdPartyWearable
} from '../../types'
import { createFilters } from './items-commons'

export const BASE_WEARABLE = 'base-wearable'
export const ON_CHAIN = 'on-chain'
export const THIRD_PARTY = 'third-party'

const VALID_COLLECTION_TYPES = ['base-wearable', 'on-chain', 'third-party']

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

export type MixedWearableResponse = Omit<MixedWearable, 'minTransferredAt' | 'maxTransferredAt'>

export type MixedWearableTrimmedResponse = {
  entity: ExplorerWearableEntity
  amount?: number
}

export type WearableFilters = {
  isSmartWearable: boolean
  network?: 'ethereum' | 'polygon'
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
  filters: WearableFilters = { isSmartWearable: false }
): Promise<MixedWearable[]> {
  async function fetchBaseWearables() {
    const { elements } = await components.baseWearablesFetcher.fetchOwnedElements(address)
    if (!elements.length) {
      return []
    }

    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    return elements.reduce<MixedBaseWearable[]>((acc, wearable, i) => {
      const entity = entities[i]
      if (entity) {
        acc.push({
          type: BASE_WEARABLE,
          ...wearable,
          entity
        })
      }
      return acc
    }, [])
  }

  async function fetchOnChainWearables(): Promise<MixedOnChainWearable[]> {
    let itemType: 'wearable' | 'smartWearable' = 'wearable'

    if (filters.isSmartWearable) {
      itemType = 'smartWearable'
    }

    const { elements } = await components.wearablesFetcher.fetchOwnedElements(address, undefined, {
      itemType,
      network: filters.network
    })

    if (!elements.length) {
      return []
    }

    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    return elements.reduce<MixedOnChainWearable[]>((acc, wearable, i) => {
      const entity = entities[i]
      if (entity) {
        acc.push({
          type: ON_CHAIN,
          ...wearable,
          entity
        })
      }
      return acc
    }, [])
  }

  async function fetchThirdPartyWearables(thirdPartyCollectionIds: string[]): Promise<MixedThirdPartyWearable[]> {
    if (thirdPartyCollectionIds.length === 0) {
      const { elements } = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)
      return elements.map((wearable: ThirdPartyWearable): MixedThirdPartyWearable => {
        const entity = wearable.entity
        return {
          type: THIRD_PARTY,
          ...wearable,
          entity
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

    return allWearables.flat().map((wearable: ThirdPartyWearable): MixedThirdPartyWearable => {
      const entity = wearable.entity
      return {
        type: THIRD_PARTY,
        ...wearable,
        entity
      }
    })
  }

  const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
    filters.isSmartWearable || filters.network
      ? []
      : collectionTypes.includes(BASE_WEARABLE)
        ? fetchBaseWearables()
        : [],
    collectionTypes.includes(ON_CHAIN) ? fetchOnChainWearables() : [],
    filters.isSmartWearable || filters.network
      ? []
      : collectionTypes.includes(THIRD_PARTY)
        ? fetchThirdPartyWearables(thirdPartyCollectionId)
        : []
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
): Promise<PaginatedResponse<MixedWearableResponse> | PaginatedResponse<MixedWearableTrimmedResponse>> {
  const { address } = context.params
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createCombinedSorting(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : VALID_COLLECTION_TYPES
  const thirdPartyCollectionIds = context.url.searchParams.has('thirdPartyCollectionId')
    ? context.url.searchParams.getAll('thirdPartyCollectionId')
    : []
  const trimmedParam = context.url.searchParams.get('trimmed')
  const isTrimmed = trimmedParam === 'true' || trimmedParam === '1'
  const isSmartWearableParam = context.url.searchParams.get('isSmartWearable')
  const isSmartWearable = isSmartWearableParam === 'true' || isSmartWearableParam === '1'
  const networkParam = context.url.searchParams.get('network')
  const network: 'ethereum' | 'polygon' | undefined =
    networkParam === 'ethereum' || networkParam === 'polygon' ? networkParam : undefined
  const includeAmountParam = context.url.searchParams.get('includeAmount')
  const includeAmount = includeAmountParam === 'true' || includeAmountParam === '1'

  if (collectionTypes.some((type) => !VALID_COLLECTION_TYPES.includes(type))) {
    throw new InvalidRequestError(`Invalid collection type. Valid types are: ${VALID_COLLECTION_TYPES.join(', ')}.`)
  }

  const page = await fetchAndPaginate<MixedWearable>(
    () =>
      fetchCombinedElements(context.components, collectionTypes, thirdPartyCollectionIds, address, {
        isSmartWearable,
        network
      }),
    pagination,
    filter,
    sorting
  )

  if (isTrimmed) {
    const results: MixedWearableTrimmedResponse[] = page.elements.map((wearable) => {
      const result: MixedWearableTrimmedResponse = {
        entity: buildTrimmedEntity(wearable.entity)
      }
      if (includeAmount) {
        result.amount = wearable.individualData?.length || 0
      }
      return result
    })

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  } else {
    const results: MixedWearableResponse[] = []
    for (const wearable of page.elements) {
      if (wearable.type === 'on-chain') {
        const { minTransferredAt, maxTransferredAt, ...clean } = wearable
        results.push({ ...clean })
      } else {
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
}
