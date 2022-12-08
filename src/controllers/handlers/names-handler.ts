import { getNamesForAddress } from '../../logic/names'
import { HandlerContextWithPath } from '../../types'

export async function namesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = parseInt(context.url.searchParams.get('pageSize') ?? '5')
  const pageNum = parseInt(context.url.searchParams.get('pageNum') ?? '1')

  const names = await getNamesForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      names: names,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
