import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/wearables/:id'>) {
  // Get request params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

  // Get wearables for requested address
  const wearables = await getWearablesForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      wearables: wearables,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
