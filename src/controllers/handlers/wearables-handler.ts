import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/wearables/:id'>) {
  // Get request params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const paginationToken = context.url.searchParams.get('paginationToken')

  // Error if token is not present when asking for a page > 1
  if (pageNum && parseInt(pageNum) > 1 && !paginationToken) {
    return {
      status: 400,
      body: {
        error: "'paginationToken' must be provided when requesting a 'pageNum' greater than 1"
      }
    }
  }

  // Get wearables for requested address
  const wearables = await getWearablesForAddress(context.components, id, pageSize, pageNum, paginationToken)

  return {
    status: 200,
    body: {
      wearables: wearables,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
