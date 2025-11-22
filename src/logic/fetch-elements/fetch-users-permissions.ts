import { AppComponents, WalletLandPermission, PermissionType } from '../../types'

type ParcelKey = `${string},${string}` // "x,y"

/**
 * Internal type for accumulating permissions from multiple sources
 */
type ParcelPermissionAccumulator = {
  x: string
  y: string
  permissions: Set<PermissionType>
  owner: string | null
}

/**
 * Query result types from LAND-permissions-graph subgraph
 */
type SubgraphParcel = {
  x: string
  y: string
  owner: { id: string } | null
  updateOperator: string | null
  operator: string | null
}

type QueryResult = {
  parcels: SubgraphParcel[]
}

/**
 * GraphQL query that retrieves parcels where user has owner, updateOperator, or operator rights
 */
const QUERY_USER_LAND_PERMISSIONS = `
query GetUserLandPermissions($address: ID!, $addressBytes: Bytes!) {
  parcels(
    first: 1000
    where: {
      or: [
        { owner_: { id: $address } }
        { updateOperator: $addressBytes }
        { operator: $addressBytes }
      ]
    }
  ) {
    x
    y
    owner { id }
    updateOperator
    operator
  }
}
`

/**
 * Creates a unique key for a parcel coordinate
 */
function createParcelKey(x: string, y: string): ParcelKey {
  return `${x},${y}`
}

/**
 * Fetches all land permissions for a user from the LAND-permissions-graph
 *
 * This function queries the subgraph for parcels where the user has:
 * - Owner rights (via owner_ relationship)
 * - UpdateOperator rights
 * - Operator rights
 *
 * All results are deduplicated and merged into a single array where each
 * parcel can have multiple permission types.
 *
 * @param components - App components (theGraph, logs)
 * @param owner - User's Ethereum address (will be normalized to lowercase)
 * @returns Array of parcels with all permission types the user has
 */
export async function fetchUserLandsPermissions(
  components: Pick<AppComponents, 'theGraph' | 'logs'>,
  owner: string
): Promise<WalletLandPermission[]> {
  const { theGraph, logs } = components
  const logger = logs.getLogger('fetch-user-lands-permissions')

  const address = owner.toLowerCase()

  logger.info(`Fetching land permissions for user: ${address}`)

  // Execute the query with both ID and Bytes address formats
  const result = await theGraph.landSubgraph.query<QueryResult>(QUERY_USER_LAND_PERMISSIONS, {
    address,
    addressBytes: address
  })

  const parcelMap = new Map<ParcelKey, ParcelPermissionAccumulator>()

  /**
   * Helper to add or update a parcel in the accumulator
   */
  function addParcel(x: string, y: string, permissionType: PermissionType, owner: string | null) {
    const key = createParcelKey(x, y)
    const existing = parcelMap.get(key)

    if (existing) {
      existing.permissions.add(permissionType)
    } else {
      parcelMap.set(key, {
        x,
        y,
        permissions: new Set([permissionType]),
        owner
      })
    }
  }

  // Process all parcels and determine permission types
  for (const parcel of result.parcels) {
    const parcelOwner = parcel.owner?.id || null

    // Check if user is the owner
    if (parcelOwner && parcelOwner.toLowerCase() === address) {
      addParcel(parcel.x, parcel.y, 'owner', parcelOwner)
    }

    // Check if user has updateOperator permission
    if (parcel.updateOperator && parcel.updateOperator.toLowerCase() === address) {
      addParcel(parcel.x, parcel.y, 'updateOperator', parcelOwner)
    }

    // Check if user has operator permission
    if (parcel.operator && parcel.operator.toLowerCase() === address) {
      addParcel(parcel.x, parcel.y, 'operator', parcelOwner)
    }
  }

  const permissions: WalletLandPermission[] = Array.from(parcelMap.values()).map((acc) => ({
    x: acc.x,
    y: acc.y,
    permissions: Array.from(acc.permissions).sort(), // Sort for consistent ordering
    owner: acc.owner
  }))

  logger.info(`Returning ${permissions.length} unique parcels with permissions for user ${address}`)

  return permissions
}
