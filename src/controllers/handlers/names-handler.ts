import { getNamesForAddress } from '../../logic/names'
import { HandlerContextWithPath } from '../../types'

export async function namesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

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
