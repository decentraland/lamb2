import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, LAND } from '../../types'
import { GetLands200 } from '@dcl/catalyst-api-specs/lib/client'

export async function landsHandler(
  context: HandlerContextWithPath<'landsFetcher' | 'logs', '/users/:address/lands'>
): Promise<{ status: 200; body: GetLands200 }> {
  const { address } = context.params
  const { landsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<LAND>(() => landsFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
