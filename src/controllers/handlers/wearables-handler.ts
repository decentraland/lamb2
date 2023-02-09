import { getWearablesForCollection } from '../../logic/third-party-wearables'
import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(
  context: HandlerContextWithPath<
    'config' | 'theGraph' | 'wearablesCaches' | 'fetch' | 'content',
    '/nfts/wearables/:id'
  >
) {
  // Get request params
  const { id } = context.params
  const includeTPW = context.url.searchParams.has('includeThirdParty')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const orderBy = context.url.searchParams.get('orderBy')
  const collectionId = context.url.searchParams.get('collectionId')

  let wearablesResponse
  if (collectionId) {
    // If collectionId is present, only that collection third-party wearables are sent
    wearablesResponse = await getWearablesForCollection(context.components, collectionId, id, includeDefinitions)
  } else {
    // Get full cached wearables response
    wearablesResponse = await getWearablesForAddress(
      context.components,
      id,
      includeTPW,
      includeDefinitions,
      pageSize,
      pageNum,
      orderBy
    )
  }

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
