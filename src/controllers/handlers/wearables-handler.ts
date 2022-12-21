import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(context: HandlerContextWithPath<'config' | 'theGraph' | 'wearablesCache', '/nfts/wearables/:id'>) {
  // Get request params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const orderBy = context.url.searchParams.get('orderBy')

  // Get wearables response
  const wearablesResponse = await getWearablesForAddress(context.components, id, pageSize, pageNum, orderBy)

  return {
    status: 200,
    body: {
      wearables: wearablesResponse.wearables,
      totalAmount: wearablesResponse.totalAmount,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
