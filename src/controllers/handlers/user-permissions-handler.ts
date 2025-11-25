import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, WalletLandPermission } from '../../types'

/**
 * Handler for fetching user land permissions
 *
 * Returns all permission types:
 * - owner: Direct parcel ownership
 * - updateOperator: Update operator rights
 * - operator: Operator rights
 *
 * Query parameters:
 * - pageSize: number - Number of results per page
 * - pageNum: number - Page number
 */
export async function userPermissionsHandler(
  context: HandlerContextWithPath<'userPermissionsFetcher', '/users/:address/permissions'>
): Promise<{
  status: 200
  body: { elements: WalletLandPermission[]; totalAmount: number; pageNum: number; pageSize: number }
}> {
  const { address } = context.params
  const { userPermissionsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<WalletLandPermission>(async () => {
    const { elements } = await userPermissionsFetcher.fetchOwnedElements(address)
    return elements
  }, pagination)

  return {
    status: 200,
    body: {
      ...page
    }
  }
}
