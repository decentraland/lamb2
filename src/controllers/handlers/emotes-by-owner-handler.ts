import { EmoteDefinition } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { parseUrn } from '../../logic/utils'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

type EmoteByOwnerResponse = {
  urn: string
  amount: number
  definition?: EmoteDefinition
}

export async function emotesByOwnerHandler(
  context: HandlerContextWithPath<
    | 'emotesFetcher'
    | 'emoteDefinitionsFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'thirdPartyProvidersStorage'
    | 'logs'
    | 'fetch',
    '/collections/emotes-by-owner/:owner'
  >
): Promise<{ status: 200; body: EmoteByOwnerResponse[] }> {
  const { emotesFetcher, emoteDefinitionsFetcher } = context.components
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
    const items = await fetchThirdPartyWearablesFromThirdPartyName(context.components, owner, urn)
    ownedItems = items.map((item) => ({ urn: item.urn, amount: item.amount }))
  } else {
    const { elements } = await emotesFetcher.fetchOwnedElements(owner)
    ownedItems = elements.map((emote) => ({ urn: emote.urn, amount: emote.individualData.length }))
  }

  if (!includeDefinitions) {
    return { status: 200, body: ownedItems }
  }

  const definitions = await emoteDefinitionsFetcher.fetchItemsDefinitions(ownedItems.map((item) => item.urn))
  return {
    status: 200,
    body: ownedItems.map((item, i) => ({ ...item, definition: definitions[i] ?? undefined }))
  }
}
