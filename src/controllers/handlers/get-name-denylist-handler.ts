import { DenylistedUsernames } from '@dcl/catalyst-api-specs/lib/client'
import { HandlerContextWithPath } from '../../types'

export async function getNameDenylistHandler(
  context: Pick<HandlerContextWithPath<'nameDenylistFetcher', '/contracts/denylisted-names'>, 'url' | 'components'>
): Promise<{ status: 200; body: DenylistedUsernames }> {
  return {
    status: 200,
    body: await context.components.nameDenylistFetcher.getNameDenylist()
  }
}
