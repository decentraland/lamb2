import { getEmotesForAddress } from '../../logic/emotes'
import { HandlerContextWithPath } from '../../types'

export async function emotesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = parseInt(context.url.searchParams.get('pageSize') ?? '5')
  const pageNum = parseInt(context.url.searchParams.get('pageNum') ?? '1')

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
