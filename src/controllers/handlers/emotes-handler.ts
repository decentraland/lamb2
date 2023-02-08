import { getEmotesForAddress } from '../../logic/emotes'
import { HandlerContextWithPath } from '../../types'

export async function emotesHandler(context: HandlerContextWithPath<'config' | 'theGraph', '/nfts/names/:id'>) {
  // Get params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

  const emotesResponse = await getEmotesForAddress(context.components, id, pageSize, pageNum)

  return {
    status: 200,
    body: {
      emotes: emotesResponse.emotes,
      totalAmount: emotesResponse.totalAmount,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
