import { Servers } from '@dcl/catalyst-api-specs/lib/client'
import { HandlerContextWithPath } from '../../types'

export async function getCatalystServersHandler(
  context: Pick<HandlerContextWithPath<'catalystsFetcher', '/contracts/servers'>, 'url' | 'components'>
): Promise<{ status: 200; body: Servers }> {
  return {
    status: 200,
    body: await context.components.catalystsFetcher.getCatalystServers()
  }
}
