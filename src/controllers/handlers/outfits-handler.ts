import { HandlerContextWithPath, NotFoundError } from '../../types'
import { getOutfits } from '../../logic/outfits'
import { Entity } from '@dcl/schemas'

export async function outfitsHandler(
  context: HandlerContextWithPath<
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches',
    '/outfits/:id'
  >
): Promise<{ status: 200; body: Entity }> {
  // This property ensures that all the NFTs being returned by this endpoint
  // will contain the tokenId part as described on the ERC-721 standard
  const ensureERC721Standard = context.url.searchParams.has('erc721')

  const outfits = await getOutfits(context.components, `${context.params.id}`, ensureERC721Standard)
  if (!outfits) {
    throw new NotFoundError('Outfits not found')
  }

  return {
    status: 200,
    body: outfits
  }
}
