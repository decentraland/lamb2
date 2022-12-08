import { getLandsForAddress } from '../../logic/lands'
import { HandlerContextWithPath } from '../../types'

export async function landsHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = parseInt(context.url.searchParams.get('pageSize') ?? '5')
  const pageNum = parseInt(context.url.searchParams.get('pageNum') ?? '1')

  const lands = await getLandsForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      lands: lands,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
