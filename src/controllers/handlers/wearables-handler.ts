import { getWearablesForCollection } from '../../logic/third-party-wearables'
import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(
  context: HandlerContextWithPath<'config' | 'theGraph' | 'wearablesCaches' | 'fetch', '/nfts/wearables/:id'>
) {
  // Get request params
  const { id } = context.params
  const includeTPW = context.url.searchParams.has('includeThirdParty')
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const orderBy = context.url.searchParams.get('orderBy')
  const collectionId = context.url.searchParams.get('collectionId')

  let wearablesResponse
  if (collectionId) {
    // If collectionId is present, only that collection thir-party wearables are sent
    wearablesResponse = await getWearablesForCollection(context.components, collectionId, id)
  } else {
    // Get full cached wearables response
    wearablesResponse = await getWearablesForAddress(context.components, id, includeTPW, pageSize, pageNum, orderBy)
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
