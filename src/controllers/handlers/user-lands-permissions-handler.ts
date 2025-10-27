import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, LandPermission } from '../../types'

/**
 * LEGACY Handler for fetching user land permissions
 *
 * @deprecated This endpoint is deprecated. Use `/users/:address/permissions` instead for comprehensive permissions.
 *
 * Returns only UpdateOperator permissions in the legacy format.
 * For comprehensive permissions including ownership, use /users/:address/permissions instead.
 *
 * Query parameters:
 * - pageSize: number - Number of results per page
 * - pageNum: number - Page number
 */
export async function userLandsPermissionsHandler(
  context: HandlerContextWithPath<'landsPermissionsFetcher', '/users/:address/lands-permissions'>
): Promise<{
  status: 200
  body: { elements: LandPermission[]; totalAmount: number; pageNum: number; pageSize: number }
  headers?: Record<string, string>
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
    },
    headers: {
      Deprecation: '1761578786'
    }
  }
}
