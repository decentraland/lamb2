import { getLandsForAddress } from '../../logic/lands'
import { HandlerContextWithPath } from '../../types'

export async function landsHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

  const landsResponse = await getLandsForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      lands: landsResponse.lands,
      totalAmount: landsResponse.totalAmount,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
