import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { HandlerContextWithPath, LandPermission, WalletLandPermission } from '../../types'

/**
 * Handler for fetching user land permissions
 *
 * Supports two modes:
 * 1. Legacy mode (default): Returns only UpdateOperator permissions
 * 2. Comprehensive mode (?includeAll=true): Returns all permission types (owner, estateOwner, updateOperator, estateUpdateOperator, updateManager)
 *
 * Query parameters:
 * - includeAll: boolean - If true, returns comprehensive permissions with all types
 * - pageSize: number - Number of results per page
 * - pageNum: number - Page number
 */
export async function userLandsPermissionsHandler(
  context: HandlerContextWithPath<
    'landsPermissionsFetcher' | 'walletPermissionsFetcher',
    '/users/:address/lands-permissions'
  >
): Promise<{
  status: 200
  body:
    | { elements: LandPermission[]; totalAmount: number; pageNum: number; pageSize: number }
    | { elements: WalletLandPermission[]; totalAmount: number; pageNum: number; pageSize: number }
}> {
  const { address } = context.params
  const { landsPermissionsFetcher, walletPermissionsFetcher } = context.components
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  // Check if comprehensive mode is requested
  const includeAll = context.url.searchParams.has('includeAll')

  if (includeAll) {
    // NEW: Comprehensive mode - returns all permission types
    const page = await fetchAndPaginate<WalletLandPermission>(async () => {
      const { elements } = await walletPermissionsFetcher.fetchOwnedElements(address)
      return elements
    }, pagination)

    return {
      status: 200,
      body: {
        ...page
      }
    }
  } else {
    // LEGACY: Keep old behavior for backward compatibility
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
}
