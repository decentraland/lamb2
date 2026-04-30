// Port of legacy GET /lambdas/collections/wearables-by-owner/:owner
// (catalyst/lambdas/src/apis/collections/controllers/wearables.ts → getWearablesByOwnerHandler).
// Wire contract:
//   response: [{ urn, amount, definition? }]   — flat array, no pagination
//   ?collectionId=<third-party-urn>            — switches to the third-party path
//   ?includeDefinitions                         — presence-only flag (any value enables it)

import { WearableDefinition } from '@dcl/schemas'
import { getItemsByOwner, ItemByOwnerEntry } from '../../logic/items-by-owner'
import { HandlerContextWithPath } from '../../types'

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
): Promise<{ status: 200; body: ItemByOwnerEntry<WearableDefinition>[] }> {
  const body = await getItemsByOwner<WearableDefinition>(
    {
      ...context.components,
      ownedFetcher: context.components.wearablesFetcher,
      definitionsFetcher: context.components.wearableDefinitionsFetcher
    },
    context.params.owner,
    context.url.searchParams
  )

  return { status: 200, body }
}
