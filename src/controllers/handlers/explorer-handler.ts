import { WearableDefinition } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createCombinedSorting } from '../../logic/sorting'
import { parseUrn } from '../../logic/utils'
import {
  AppComponents,
  BaseWearable,
  ErrorResponse,
  HandlerContextWithPath,
  OnChainWearable,
  PaginatedResponse,
  ThirdPartyWearable
} from '../../types'
import { createFilters } from './items-commons'

type MixedBaseWearable = BaseWearable & {
  type: 'base-wearable'
}

type MixedOnChainWearable = OnChainWearable & {
  type: 'on-chain'
}

type MixedThirdPartyWearable = ThirdPartyWearable & {
  type: 'third-party'
}

type MixedWearable = MixedBaseWearable | MixedOnChainWearable | MixedThirdPartyWearable

export type MixedWearableResponse = (
  | MixedBaseWearable
  | Omit<MixedOnChainWearable, 'minTransferredAt' | 'maxTransferredAt'>
  | MixedThirdPartyWearable
) & {
  definition?: WearableDefinition
} & Partial<Pick<OnChainWearable, 'rarity'>>

function createCombinedFetcher(
  components: Pick<
    AppComponents,
    | 'fetch'
    | 'theGraph'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher'
  >,
  collectionTypes: string[],
  thirdPartyCollectionId: string[]
): (address: string) => Promise<MixedWearable[]> {
  return async function (address: string): Promise<MixedWearable[]> {
    const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
      collectionTypes.includes('base-wearable')
        ? components.baseWearablesFetcher.fetchOwnedElements(address).then((elements: BaseWearable[]) =>
            elements.map(
              (wearable: BaseWearable): MixedBaseWearable => ({
                type: 'base-wearable',
                ...wearable
              })
            )
          )
        : [],
      collectionTypes.includes('on-chain')
        ? components.wearablesFetcher.fetchOwnedElements(address).then((elements: OnChainWearable[]) =>
            elements.map(
              (wearable: OnChainWearable): MixedOnChainWearable => ({
                type: 'on-chain',
                ...wearable
              })
            )
          )
        : ([] as MixedOnChainWearable[]),
      collectionTypes.includes('third-party')
        ? thirdPartyCollectionId.length === 0
          ? components.thirdPartyWearablesFetcher.fetchOwnedElements(address).then((elements: ThirdPartyWearable[]) =>
              elements.map((wearable: ThirdPartyWearable): MixedThirdPartyWearable => {
                return {
                  type: 'third-party',
                  ...wearable
                }
              })
            )
          : Promise.all(
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
            ).then((elements: MixedThirdPartyWearable[][]) => elements.flat(1))
        : []
    ])

    return [...baseItems, ...nftItems, ...thirdPartyItems]
  }
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'fetch'
    | 'theGraph'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher',
    '/explorer-service/backpack/:address/wearables'
  >
): Promise<PaginatedResponse<MixedWearableResponse> | ErrorResponse> {
  const { wearableDefinitionsFetcher } = context.components
  const { address } = context.params
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createCombinedSorting<MixedWearable>(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : ['base-wearable', 'on-chain', 'third-party']
  const thirdPartyCollectionId = context.url.searchParams.has('thirdPartyCollectionId')
    ? context.url.searchParams.getAll('thirdPartyCollectionId')
    : []

  const fetchCombinedElements = createCombinedFetcher(context.components, collectionTypes, thirdPartyCollectionId)

  const page = await fetchAndPaginate<MixedWearable>(address, fetchCombinedElements, pagination, filter, sorting)

  const definitions: (WearableDefinition | undefined)[] = await wearableDefinitionsFetcher.fetchItemsDefinitions(
    page.elements.map((wearable) => wearable.urn)
  )

  const results: MixedWearableResponse[] = []
  const wearables = page.elements

  for (let i = 0; i < wearables.length; ++i) {
    if (wearables[i].type === 'on-chain') {
      const casted = wearables[i] as MixedOnChainWearable
      const { minTransferredAt, maxTransferredAt, ...clean } = casted
      results.push({ ...clean, definition: definitions[i] || undefined })
    } else if (wearables[i].type === 'base-wearable') {
      const casted = wearables[i] as MixedBaseWearable
      results.push({ ...casted, definition: casted.definition })
    } else {
      const casted = wearables[i] as MixedThirdPartyWearable
      results.push({ ...casted, definition: definitions[i] || undefined })
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
