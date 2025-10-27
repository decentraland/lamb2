import { AppComponents, WalletLandPermission, PermissionType } from '../../types'

type ParcelKey = `${string},${string}` // "x,y"

/**
 * Internal type for accumulating permissions from multiple sources
 */
type ParcelPermissionAccumulator = {
  x: string
  y: string
  permissions: Set<PermissionType>
  estate?: { id: string; size: number }
}

/**
 * Query result types from LAND-permissions-graph subgraph
 */
type SubgraphParcel = {
  x: string
  y: string
  tokenId: string
  id: string
}

type SubgraphUser = {
  parcels: SubgraphParcel[]
  estates: Array<{
    id: string
    size: number
    parcels: SubgraphParcel[]
  }>
}

type SubgraphParcelWithOwner = SubgraphParcel & {
  owner: { id: string }
  estate?: { id: string; size: number }
}

type SubgraphEstate = {
  id: string
  size: number
  owner: { id: string }
  parcels: SubgraphParcel[]
}

type SubgraphAuthorization = {
  owner: {
    parcels: Array<
      SubgraphParcel & {
        estate?: { id: string; size: number }
      }
    >
    estates: Array<{
      id: string
      size: number
      parcels: SubgraphParcel[]
    }>
  }
}

type QueryResult = {
  user: SubgraphUser | null
  updateOperatorParcels: SubgraphParcelWithOwner[]
  updateOperatorEstates: SubgraphEstate[]
  updateManagerAuthorizations: SubgraphAuthorization[]
}

/**
 * Comprehensive GraphQL query that retrieves all authorization types for a user
 * Based on validated query from GRAPH_QUERY_DISCOVERY.md
 *
 * Note: The subgraph entity is called 'wallet' but we alias it as 'user' for semantic consistency
 */
const QUERY_USER_PERMISSIONS = `
query GetAllUserPermissions($address: String!) {
  # 1. Direct parcel and estate ownership
  user: wallet(id: $address) {
    parcels {
      x
      y
      tokenId
      id
    }
    estates {
      id
      size
      parcels {
        x
        y
        tokenId
        id
      }
    }
  }

  # 2. Parcel-level UpdateOperator permissions
  updateOperatorParcels: parcels(
    where: { updateOperator: $address }
    first: 1000
  ) {
    x
    y
    tokenId
    id
    owner { id }
    estate { id, size }
  }

  # 3. Estate-level UpdateOperator permissions
  updateOperatorEstates: estates(
    where: { updateOperator: $address }
    first: 1000
  ) {
    id
    size
    owner { id }
    parcels {
      x
      y
      tokenId
      id
    }
  }

  # 4. Address-level UpdateManager permissions
  updateManagerAuthorizations: authorizations(
    where: {
      operator: $address
      type: "UpdateManager"
      isApproved: true
    }
    first: 1000
  ) {
    owner {
      parcels {
        x
        y
        tokenId
        id
        estate { id, size }
      }
      estates {
        id
        size
        parcels {
          x
          y
          tokenId
          id
        }
      }
    }
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
 * This function queries the subgraph for:
 * - Direct parcel ownership
 * - Estate ownership (with parcels)
 * - Parcel-level UpdateOperator permissions
 * - Estate-level UpdateOperator permissions
 * - Address-level UpdateManager permissions
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

  // CRITICAL: Normalize address to lowercase (required by The Graph)
  // Verified in GRAPH_QUERY_DISCOVERY.md - Test 7: mixed case returns no results
  const address = owner.toLowerCase()

  logger.info(`Fetching comprehensive land permissions for user: ${address}`)

  // Execute the comprehensive query
  const result = await theGraph.landSubgraph.query<QueryResult>(QUERY_USER_PERMISSIONS, {
    address
  })

  // Accumulator map: parcel key -> permission data
  const parcelMap = new Map<ParcelKey, ParcelPermissionAccumulator>()

  /**
   * Helper to add or update a parcel in the accumulator
   */
  function addParcel(x: string, y: string, permissionType: PermissionType, estate?: { id: string; size: number }) {
    const key = createParcelKey(x, y)
    const existing = parcelMap.get(key)

    if (existing) {
      // Add permission type to existing entry
      existing.permissions.add(permissionType)

      // Update estate info if provided and not already set
      if (estate && !existing.estate) {
        existing.estate = estate
      }
    } else {
      // Create new entry
      parcelMap.set(key, {
        x,
        y,
        permissions: new Set([permissionType]),
        estate
      })
    }
  }

  // 1. Process direct parcel ownership
  if (result.user?.parcels) {
    logger.debug(`Found ${result.user.parcels.length} directly owned parcels`)
    for (const parcel of result.user.parcels) {
      addParcel(parcel.x, parcel.y, 'owner')
    }
  }

  // 2. Process estate ownership (parcels within owned estates)
  if (result.user?.estates) {
    logger.debug(`Found ${result.user.estates.length} directly owned estates`)
    for (const estate of result.user.estates) {
      // Filter out empty estates (size: 0)
      if (estate.size > 0 && estate.parcels) {
        for (const parcel of estate.parcels) {
          addParcel(parcel.x, parcel.y, 'estateOwner', { id: estate.id, size: estate.size })
        }
      }
    }
  }

  // 3. Process parcel-level UpdateOperator permissions
  logger.debug(`Found ${result.updateOperatorParcels.length} parcels with UpdateOperator`)
  for (const parcel of result.updateOperatorParcels) {
    addParcel(
      parcel.x,
      parcel.y,
      'updateOperator',
      parcel.estate ? { id: parcel.estate.id, size: parcel.estate.size } : undefined
    )
  }

  // 4. Process estate-level UpdateOperator permissions
  logger.debug(`Found ${result.updateOperatorEstates.length} estates with UpdateOperator`)
  for (const estate of result.updateOperatorEstates) {
    if (estate.size > 0 && estate.parcels) {
      for (const parcel of estate.parcels) {
        addParcel(parcel.x, parcel.y, 'estateUpdateOperator', { id: estate.id, size: estate.size })
      }
    }
  }

  // 5. Process UpdateManager authorizations (address-level)
  logger.debug(`Found ${result.updateManagerAuthorizations.length} UpdateManager authorizations`)
  for (const auth of result.updateManagerAuthorizations) {
    // Process owner's parcels
    if (auth.owner.parcels) {
      for (const parcel of auth.owner.parcels) {
        addParcel(
          parcel.x,
          parcel.y,
          'updateManager',
          parcel.estate ? { id: parcel.estate.id, size: parcel.estate.size } : undefined
        )
      }
    }

    // Process owner's estates
    if (auth.owner.estates) {
      for (const estate of auth.owner.estates) {
        if (estate.size > 0 && estate.parcels) {
          for (const parcel of estate.parcels) {
            addParcel(parcel.x, parcel.y, 'updateManager', { id: estate.id, size: estate.size })
          }
        }
      }
    }
  }

  // Convert accumulator to final result array
  const permissions: WalletLandPermission[] = Array.from(parcelMap.values()).map((acc) => ({
    x: acc.x,
    y: acc.y,
    permissions: Array.from(acc.permissions).sort(), // Sort for consistent ordering
    estate: acc.estate
  }))

  logger.info(`Returning ${permissions.length} unique parcels with permissions for user ${address}`)

  return permissions
}
