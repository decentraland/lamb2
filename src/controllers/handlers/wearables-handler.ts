import { getWearablesForCollection } from '../../logic/third-party-wearables'
import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath, Pagination } from '../../types'

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
  const collectionId = context.url.searchParams.get('collectionId')

  let wearablesResponse
  if (collectionId) {
    // If collectionId is present, only that collection third-party wearables are sent
    wearablesResponse = await getWearablesForCollection(context.components, collectionId, id, includeDefinitions)
  } else {
    // Get full cached wearables response
    wearablesResponse = await getWearablesForAddress(context.components, id, includeTPW, includeDefinitions, pagination)
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

function paginationObject(url: URL): Pagination {
  const pageSize = url.searchParams.has('pageSize') ? parseInt(url.searchParams.get('pageSize')!, 10) : undefined
  const pageNum = url.searchParams.has('pageNum') ? parseInt(url.searchParams.get('pageNum')!, 10) : undefined
  const orderBy = url.searchParams.get('orderBy') || undefined

  return { pageSize, pageNum, orderBy }
}
