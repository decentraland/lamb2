import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, Name } from '../../types'
import { NamesPaginated } from '@dcl/catalyst-api-specs/lib/client'

export async function namesHandler(
  context: HandlerContextWithPath<'dappsDb' | 'logs', '/users/:address/names'>
): Promise<{ status: 200; body: NamesPaginated }> {
  const { address } = context.params
  const { dappsDb } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<Name>(() => dappsDb.getNamesByOwner(address), pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
