import { Entity } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createCombinedSorting } from '../../logic/sorting'
import { parseUrn } from '../../logic/utils'
import {
  AppComponents,
  BaseWearable,
  HandlerContextWithPath,
  InvalidRequestError,
  LinkedWearable,
  OnChainWearable,
  PaginatedResponse,
  ThirdPartyWearable
} from '../../types'
import { createFilters } from './items-commons'
import { fetchLinkedWearablesFromProvider } from '../../logic/fetch-elements/fetch-linked-wearables'

const VALID_COLLECTION_TYPES = ['base-wearable', 'on-chain', 'third-party', 'linked-wearable']

type MixedBaseWearable = BaseWearable & {
  type: 'base-wearable'
  entity: Entity
}

type MixedOnChainWearable = OnChainWearable & {
  type: 'on-chain'
  entity: Entity
}

type MixedThirdPartyWearable = ThirdPartyWearable & {
  type: 'third-party'
}

type MixedLinkedWearable = BaseWearable & {
  type: 'linked-wearable'
}

export type MixedWearable = (MixedBaseWearable | MixedOnChainWearable | MixedThirdPartyWearable | MixedLinkedWearable) &
  Partial<Pick<OnChainWearable, 'rarity'>>

export type MixedWearableResponse = Omit<MixedWearable, 'minTransferredAt' | 'maxTransferredAt'>

async function fetchCombinedElements(
  components: Pick<
    AppComponents,
    | 'fetch'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'entitiesFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'thirdPartyProvidersStorage'
    | 'linkedWearablesFetcher'
    | 'linkedWearableProvidersStorage'
  >,
  collectionTypes: string[],
  thirdPartyCollectionIds: string[],
  linkedWearableCollectionIds: string[],
  address: string
): Promise<MixedWearable[]> {
  async function fetchBaseWearables() {
    const elements = await components.baseWearablesFetcher.fetchOwnedElements(address)
    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    const result: MixedBaseWearable[] = []
    for (let i = 0; i < elements.length; ++i) {
      const wearable = elements[i]
      const entity = entities[i]
      if (!entity) {
        continue
      }
      result.push({
        type: 'base-wearable',
        ...wearable,
        entity
      })
    }
    return result
  }

  async function fetchOnChainWearables(): Promise<MixedOnChainWearable[]> {
    const elements = await components.wearablesFetcher.fetchOwnedElements(address)
    const entities = await components.entitiesFetcher.fetchEntities(elements.map((e) => e.urn))
    const result: MixedOnChainWearable[] = []
    for (let i = 0; i < elements.length; ++i) {
      const wearable = elements[i]
      const entity = entities[i]
      if (!entity) {
        continue
      }
      result.push({
        type: 'on-chain',
        ...wearable,
        entity
      })
    }
    return result
  }

  async function fetchThirdPartyWearables(thirdPartyCollectionId: string[]): Promise<MixedThirdPartyWearable[]> {
    if (thirdPartyCollectionId.length === 0) {
      const elements = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)
      return elements.map(
        (wearable: ThirdPartyWearable): MixedThirdPartyWearable => ({
          type: 'third-party',
          ...wearable
        })
      )
    } else {
      const elements = await Promise.all(
        thirdPartyCollectionId.map(async (thirdPartyCollectionId) => {
          // Strip the last part (the 6th part) if a collection contract id is specified
          const collectionIdCleaned = thirdPartyCollectionId.split(':').slice(0, 5).join(':')
          const urn = await parseUrn(collectionIdCleaned)
          if (!urn || urn.type !== 'blockchain-collection-third-party-name') {
            return []
          }

          return (await fetchThirdPartyWearablesFromThirdPartyName(components, address, urn)).map(
            (wearable: ThirdPartyWearable): MixedThirdPartyWearable => {
              return {
                type: 'third-party',
                ...wearable
              }
            }
          )
        })
      )
      return elements.flat(1)
    }
  }

  async function fetchLinkedWearables(linkedWearablesCollectionIds: string[]): Promise<MixedLinkedWearable[]> {
    if (linkedWearablesCollectionIds.length === 0) {
      const elements = await components.linkedWearablesFetcher.fetchOwnedElements(address)
      return elements.map(
        (wearable: LinkedWearable): MixedLinkedWearable => ({
          type: 'linked-wearable',
          ...wearable
        })
      )
    }

    const elements = await Promise.all(
      linkedWearablesCollectionIds.map(async (linkedWearablesCollectionId) => {
        // Strip the last part (the 6th part) if a collection contract id is specified
        const collectionIdCleaned = linkedWearablesCollectionId.split(':').slice(0, 5).join(':')
        const urn = await parseUrn(collectionIdCleaned)
        if (!urn || urn.type !== 'blockchain-collection-linked-wearables-provider') {
          return []
        }

        return (await fetchLinkedWearablesFromProvider(components, address, urn)).map(
          (wearable: LinkedWearable): MixedLinkedWearable => {
            return {
              type: 'linked-wearable',
              ...wearable
            }
          }
        )
      })
    )

    return elements.flat(1)
  }

  const [baseItems, nftItems, thirdPartyItems, linkedItems] = await Promise.all([
    collectionTypes.includes('base-wearable') ? fetchBaseWearables() : [],
    collectionTypes.includes('on-chain') ? fetchOnChainWearables() : [],
    collectionTypes.includes('third-party') ? fetchThirdPartyWearables(thirdPartyCollectionIds) : [],
    collectionTypes.includes('linked-wearable') ? fetchLinkedWearables(linkedWearableCollectionIds) : []
  ])

  return [...baseItems, ...nftItems, ...thirdPartyItems, ...linkedItems]
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'fetch'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'entitiesFetcher'
    | 'thirdPartyProvidersStorage'
    | 'linkedWearablesFetcher'
    | 'linkedWearableProvidersStorage',
    '/explorer/:address/wearables'
  >
): Promise<PaginatedResponse<MixedWearableResponse>> {
  const { address } = context.params
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createCombinedSorting<MixedWearable>(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : VALID_COLLECTION_TYPES
  const thirdPartyCollectionIds = context.url.searchParams.has('thirdPartyCollectionId')
    ? context.url.searchParams.getAll('thirdPartyCollectionId')
    : []
  const linkedWearableCollectionIds = context.url.searchParams.has('linkedWearableCollectionIds')
    ? context.url.searchParams.getAll('linkedWearableCollectionId')
    : []

  if (collectionTypes.some((type) => !VALID_COLLECTION_TYPES.includes(type))) {
    throw new InvalidRequestError(`Invalid collection type. Valid types are: ${VALID_COLLECTION_TYPES.join(', ')}.`)
  }

  const page = await fetchAndPaginate<MixedWearable>(
    () =>
      fetchCombinedElements(
        context.components,
        collectionTypes,
        thirdPartyCollectionIds,
        linkedWearableCollectionIds,
        address
      ),
    pagination,
    filter,
    sorting
  )

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
