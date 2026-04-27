import { EmoteDefinition, WearableDefinition } from '@dcl/schemas'
import { DefinitionsFetcher } from '../adapters/definitions-fetcher'
import { ElementsFetcher } from '../adapters/elements-fetcher'
import { fetchThirdPartyWearablesFromThirdPartyName } from './fetch-elements/fetch-third-party-wearables'
import { parseUrn } from './utils'
import { AppComponents, InvalidRequestError } from '../types'

export type ItemByOwnerEntry<T extends WearableDefinition | EmoteDefinition> = {
  urn: string
  amount: number
  definition?: T
}

type OwnedItem = { urn: string; individualData: { id: string }[] }

export type ItemsByOwnerComponents<T extends WearableDefinition | EmoteDefinition> = Pick<
  AppComponents,
  'thirdPartyWearablesFetcher' | 'thirdPartyProvidersStorage' | 'logs' | 'fetch'
> & {
  ownedFetcher: ElementsFetcher<OwnedItem>
  definitionsFetcher: DefinitionsFetcher<T>
}

export async function getItemsByOwner<T extends WearableDefinition | EmoteDefinition>(
  components: ItemsByOwnerComponents<T>,
  owner: string,
  searchParams: URLSearchParams
): Promise<ItemByOwnerEntry<T>[]> {
  // Legacy ?includeDefinitions semantics: presence-only, value is ignored.
  // ?includeDefinitions=false still enables it. Preserved for caller compatibility.
  const includeDefinitions = searchParams.has('includeDefinitions')
  const collectionId = searchParams.get('collectionId') ?? undefined

  const ownedItems = collectionId
    ? await fetchByThirdPartyCollection(components, owner, collectionId)
    : await fetchOwnedOnChain(components.ownedFetcher, owner)

  if (!includeDefinitions) {
    return ownedItems
  }

  const definitions = await components.definitionsFetcher.fetchItemsDefinitions(ownedItems.map((item) => item.urn))
  return ownedItems.map((item, i) => ({ ...item, definition: definitions[i] ?? undefined }))
}

async function fetchOwnedOnChain(
  fetcher: ElementsFetcher<OwnedItem>,
  owner: string
): Promise<{ urn: string; amount: number }[]> {
  const { elements } = await fetcher.fetchOwnedElements(owner)
  return elements.map((item) => ({ urn: item.urn, amount: item.individualData.length }))
}

async function fetchByThirdPartyCollection(
  components: Pick<AppComponents, 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersStorage' | 'logs' | 'fetch'>,
  owner: string,
  collectionId: string
): Promise<{ urn: string; amount: number }[]> {
  const cleaned = collectionId.split(':').slice(0, 5).join(':')
  const urn = await parseUrn(cleaned)
  if (!urn || urn.type !== 'blockchain-collection-third-party-name') {
    throw new InvalidRequestError(`Invalid collectionId: ${collectionId} is not a third-party collection URN`)
  }
  const items = await fetchThirdPartyWearablesFromThirdPartyName(components, owner, urn)
  return items.map((item) => ({ urn: item.urn, amount: item.amount }))
}
