import { EmoteDefinition } from '@dcl/schemas'
import { getItemsByOwner, ItemByOwnerEntry } from '../../logic/items-by-owner'
import { HandlerContextWithPath } from '../../types'

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
): Promise<{ status: 200; body: ItemByOwnerEntry<EmoteDefinition>[] }> {
  const body = await getItemsByOwner<EmoteDefinition>(
    {
      ...context.components,
      ownedFetcher: context.components.emotesFetcher,
      definitionsFetcher: context.components.emoteDefinitionsFetcher
    },
    context.params.owner,
    context.url.searchParams
  )

  return { status: 200, body }
}
