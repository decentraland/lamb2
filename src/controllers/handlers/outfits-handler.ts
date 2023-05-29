import { HandlerContextWithPath, NotFoundError, TypedEntity } from '../../types'
import { getOutfits } from '../../logic/outfits'
import { Outfits } from '@dcl/schemas'

export async function outfitsHandler(
  context: HandlerContextWithPath<
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches',
    '/profile/:id'
  >
): Promise<{ status: 200; body: TypedEntity<Outfits> }> {
  const outfits = await getOutfits(context.components, `${context.params.id}:outfits`)
  if (!outfits) {
    throw new NotFoundError('Outfits not found')
  }

  return {
    status: 200,
    body: outfits
  }
}
