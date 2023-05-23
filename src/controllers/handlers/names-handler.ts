import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Name } from '../../types'
import { GetNames200 } from '@dcl/catalyst-api-specs/lib/client'

export async function namesHandler(
  context: HandlerContextWithPath<'namesFetcher' | 'logs', '/users/:address/names'>
): Promise<{ status: 200; body: GetNames200 }> {
  const { address } = context.params
  const { namesFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<Name>(() => namesFetcher.fetchOwnedElements(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
