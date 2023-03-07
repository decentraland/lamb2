import { getWearablesForCollection } from '../../logic/third-party-wearables'
import { paginationObject } from '../../logic/utils'
import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(
  context: HandlerContextWithPath<
    'config' | 'theGraph' | 'thirdPartyComponent' | 'wearablesComponent' | 'definitions' | 'fetch' | 'content' | 'logs',
    '/nfts/wearables/:id'
  >
) {
  // Get request params
  const { id } = context.params
  const includeTPW = context.url.searchParams.has('includeThirdParty')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')

  const pagination = paginationObject(context.url)
  if (pagination.orderBy && pagination.orderBy !== 'rarity') {
    // TODO
    return {
      status: 400,
      body: {}
    }
  }
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
      { includeTPW, includeDefinitions },
      pagination
    )
  }

  return {
    status: 200,
    body: {
      wearables: wearablesResponse.wearables,
      totalAmount: wearablesResponse.totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}
