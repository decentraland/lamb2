import { WearableDefinition } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { parseUrn } from '../../logic/utils'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

type WearableByOwnerResponse = {
  urn: string
  amount: number
  definition?: WearableDefinition
}

export async function wearablesByOwnerHandler(
  context: HandlerContextWithPath<
    | 'wearablesFetcher'
    | 'wearableDefinitionsFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'thirdPartyProvidersStorage'
    | 'logs'
    | 'fetch',
    '/collections/wearables-by-owner/:owner'
  >
): Promise<{ status: 200; body: WearableByOwnerResponse[] }> {
  const { wearablesFetcher, wearableDefinitionsFetcher } = context.components
  const { owner } = context.params

  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const collectionId = context.url.searchParams.get('collectionId') ?? undefined

  let ownedItems: { urn: string; amount: number }[]
  if (collectionId) {
    const cleaned = collectionId.split(':').slice(0, 5).join(':')
    const urn = await parseUrn(cleaned)
    if (!urn || urn.type !== 'blockchain-collection-third-party-name') {
      throw new InvalidRequestError(`Invalid collectionId: ${collectionId} is not a third-party collection URN`)
    }
    const wearables = await fetchThirdPartyWearablesFromThirdPartyName(context.components, owner, urn)
    ownedItems = wearables.map((wearable) => ({ urn: wearable.urn, amount: wearable.amount }))
  } else {
    const { elements } = await wearablesFetcher.fetchOwnedElements(owner)
    ownedItems = elements.map((wearable) => ({ urn: wearable.urn, amount: wearable.individualData.length }))
  }

  if (!includeDefinitions) {
    return { status: 200, body: ownedItems }
  }

  const definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(ownedItems.map((item) => item.urn))
  return {
    status: 200,
    body: ownedItems.map((item, i) => ({ ...item, definition: definitions[i] ?? undefined }))
  }
}
