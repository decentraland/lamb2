import { getEmotesForAddress, getEmotesForCollection } from '../../logic/emotes'
import { HandlerContextWithPath } from '../../types'

export async function emotesHandler(
  context: HandlerContextWithPath<'config' | 'theGraph' | 'fetch' | 'content' | 'emotesCaches', '/nfts/emotes/:id'>
) {
  // Get request params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const collectionId = context.url.searchParams.get('collectionId')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')

  let emotesResponse
  if (collectionId) {
    // If collectionId is present, only that collection third-party emotes are sent
    emotesResponse = await getEmotesForCollection(context.components, collectionId, id, includeDefinitions)
  } else {
    // Get  emotes response
    emotesResponse = await getEmotesForAddress(context.components, id, includeDefinitions, pageSize, pageNum)
  }

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
