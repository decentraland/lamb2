import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Name } from '../../types'
import { NamesPaginated } from '@dcl/catalyst-api-specs/lib/client'
import { shouldBypassCache } from '../../logic/cache'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<{ status: 200; body: NamesPaginated }> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  // Check if we should bypass cache
  // Headers supported: X-Bypass-Cache: true or Cache-Control: no-cache
  const bypassCache = shouldBypassCache(context.request)

  const page = await fetchAndPaginate<Name>(() => namesFetcher.fetchOwnedElements(address, bypassCache), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
