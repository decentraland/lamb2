import { getWearablesForAddress } from '../../logic/wearables'
import { HandlerContextWithPath } from '../../types'

export async function wearablesHandler(context: HandlerContextWithPath<'config' | 'theGraph' | 'wearablesCache', '/nfts/wearables/:id'>) {
  // Get request params
  const { id } = context.params
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')

  let wearables
  if (pageSize && pageNum)
    wearables = await getWearablesForAddress(context.components, id, parseInt(pageSize), parseInt(pageNum))
  else
    wearables = await getWearablesForAddress(context.components, id)

  return {
    status: 200,
    body: {
      wearables: wearables,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}
