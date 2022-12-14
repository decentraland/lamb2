import { getEmotesForAddress } from '../../logic/emotes'
import { HandlerContextWithPath } from '../../types'

export async function emotesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

  const emotes = await getEmotesForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      emotes: emotes,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
