import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, LandPermission } from '../../types'

// TODO: support approvedForAll, operator and updateManagers
export async function userLandsPermissionsHandler(
  context: HandlerContextWithPath<'landsPermissionsFetcher', '/users/:address/lands-permissions'>
): Promise<{
  status: 200
  body: { elements: LandPermission[]; totalAmount: number; pageNum: number; pageSize: number }
}> {
  const { address } = context.params
  const { landsPermissionsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<LandPermission>(async () => {
    const { elements } = await landsPermissionsFetcher.fetchOwnedElements(address)
    return elements
  }, pagination)
  return {
    status: 200,
    body: {
      ...page
    }
  }
}
