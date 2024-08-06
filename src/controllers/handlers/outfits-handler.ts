import { HandlerContextWithPath, NotFoundError } from '../../types'
import { getOutfits } from '../../logic/outfits'
import { Entity } from '@dcl/schemas'

export async function outfitsHandler(
  context: HandlerContextWithPath<
    | 'alchemyNftFetcher'
    | 'metrics'
    | 'content'
    | 'contentServerUrl'
    | 'entitiesFetcher'
    | 'theGraph'
    | 'config'
    | 'fetch'
    | 'ownershipCaches'
    | 'wearablesFetcher'
    | 'namesFetcher'
    | 'thirdPartyProvidersStorage'
    | 'logs',
    '/outfits/:id'
  >
): Promise<{ status: 200; body: Entity }> {
  const outfits = await getOutfits(context.components, `${context.params.id}`)
  if (!outfits) {
    throw new NotFoundError('Outfits not found')
  }

  return {
    status: 200,
    body: outfits
  }
}
