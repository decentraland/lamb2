import { Pois } from '@dcl/catalyst-api-specs/lib/client'
import { HandlerContextWithPath } from '../../types'

export async function getPOIsHandler(
  context: Pick<HandlerContextWithPath<'poisFetcher', '/contracts/pois'>, 'url' | 'components'>
): Promise<{ status: 200; body: Pois }> {
  return {
    status: 200,
    body: await context.components.poisFetcher.getPOIs()
  }
}
