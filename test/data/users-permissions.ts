import { WalletLandPermission, PermissionType } from '../../src/types'

/**
 * Graph query result types matching the structure from fetchUserLandsPermissions
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

export type GraphQueryResult = {
  user: SubgraphUser | null
  updateOperatorParcels: SubgraphParcelWithOwner[]
  updateOperatorEstates: SubgraphEstate[]
  updateManagerAuthorizations: SubgraphAuthorization[]
}

/**
 * Helper to create a basic parcel structure
 */
function createParcel(x: number, y: number): SubgraphParcel {
  return {
    x: x.toString(),
    y: y.toString(),
    tokenId: `token-${x}-${y}`,
    id: `parcel-${x}-${y}`
  }
}

/**
 * Creates an empty graph query result (no permissions)
 */
export function createEmptyGraphResult(): GraphQueryResult {
  return {
    user: null,
    updateOperatorParcels: [],
    updateOperatorEstates: [],
    updateManagerAuthorizations: []
  }
}

/**
 * Creates a graph result with direct parcel ownership
 */
export function createOwnerGraphResult(ownerAddress: string, parcelCount: number = 1): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => createParcel(i, i * 2))

  return {
    user: {
      parcels,
      estates: []
    },
    updateOperatorParcels: [],
    updateOperatorEstates: [],
    updateManagerAuthorizations: []
  }
}

/**
 * Creates a graph result with estate ownership
 */
export function createEstateOwnerGraphResult(
  ownerAddress: string,
  estateCount: number = 1,
  parcelsPerEstate: number = 3
): GraphQueryResult {
  const estates = Array.from({ length: estateCount }, (_, estateIdx) => {
    const parcels = Array.from({ length: parcelsPerEstate }, (_, parcelIdx) => {
      const offset = estateIdx * parcelsPerEstate
      return createParcel(offset + parcelIdx, (offset + parcelIdx) * 2)
    })

    return {
      id: `estate-${estateIdx}`,
      size: parcelsPerEstate,
      parcels
    }
  })

  return {
    user: {
      parcels: [],
      estates
    },
    updateOperatorParcels: [],
    updateOperatorEstates: [],
    updateManagerAuthorizations: []
  }
}

/**
 * Creates a graph result with parcel-level updateOperator permissions
 */
export function createUpdateOperatorGraphResult(
  operatorAddress: string,
  ownerAddress: string,
  parcelCount: number = 1
): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => ({
    ...createParcel(i, i * 2),
    owner: { id: ownerAddress }
  }))

  return {
    user: null,
    updateOperatorParcels: parcels,
    updateOperatorEstates: [],
    updateManagerAuthorizations: []
  }
}

/**
 * Creates a graph result with estate-level updateOperator permissions
 */
export function createEstateUpdateOperatorGraphResult(
  operatorAddress: string,
  ownerAddress: string,
  estateCount: number = 1,
  parcelsPerEstate: number = 3
): GraphQueryResult {
  const estates = Array.from({ length: estateCount }, (_, estateIdx) => {
    const parcels = Array.from({ length: parcelsPerEstate }, (_, parcelIdx) => {
      const offset = estateIdx * parcelsPerEstate
      return createParcel(offset + parcelIdx, (offset + parcelIdx) * 2)
    })

    return {
      id: `estate-${estateIdx}`,
      size: parcelsPerEstate,
      owner: { id: ownerAddress },
      parcels
    }
  })

  return {
    user: null,
    updateOperatorParcels: [],
    updateOperatorEstates: estates,
    updateManagerAuthorizations: []
  }
}

/**
 * Creates a graph result with updateManager permissions
 */
export function createUpdateManagerGraphResult(
  managerAddress: string,
  ownerAddress: string,
  parcelCount: number = 1
): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => createParcel(i, i * 2))

  return {
    user: null,
    updateOperatorParcels: [],
    updateOperatorEstates: [],
    updateManagerAuthorizations: [
      {
        owner: {
          parcels,
          estates: []
        }
      }
    ]
  }
}

/**
 * Creates a graph result with multiple permission types on the same parcels
 * Useful for testing permission merging logic
 */
export function createMixedPermissionsGraphResult(
  userAddress: string,
  ownerAddress: string,
  options: {
    includeOwner?: boolean
    includeEstateOwner?: boolean
    includeUpdateOperator?: boolean
    includeEstateUpdateOperator?: boolean
    includeUpdateManager?: boolean
  }
): GraphQueryResult {
  const parcel = createParcel(0, 0)
  const estate = { id: 'estate-mixed', size: 3 }

  const result: GraphQueryResult = {
    user: null,
    updateOperatorParcels: [],
    updateOperatorEstates: [],
    updateManagerAuthorizations: []
  }

  // Add owner permission
  if (options.includeOwner) {
    result.user = {
      parcels: [parcel],
      estates: []
    }
  }

  // Add estate owner permission
  if (options.includeEstateOwner) {
    result.user = result.user || { parcels: [], estates: [] }
    result.user.estates.push({
      id: estate.id,
      size: estate.size,
      parcels: [parcel]
    })
  }

  // Add updateOperator permission
  if (options.includeUpdateOperator) {
    result.updateOperatorParcels.push({
      ...parcel,
      owner: { id: ownerAddress },
      estate: options.includeEstateOwner ? estate : undefined
    })
  }

  // Add estateUpdateOperator permission
  if (options.includeEstateUpdateOperator) {
    result.updateOperatorEstates.push({
      id: estate.id,
      size: estate.size,
      owner: { id: ownerAddress },
      parcels: [parcel]
    })
  }

  // Add updateManager permission
  if (options.includeUpdateManager) {
    result.updateManagerAuthorizations.push({
      owner: {
        parcels: [parcel],
        estates: []
      }
    })
  }

  return result
}

/**
 * Creates expected WalletLandPermission response
 */
export function createExpectedPermission(
  x: number,
  y: number,
  permissions: PermissionType[],
  options: {
    estate?: { id: string; size: number }
  } = {}
): WalletLandPermission {
  return {
    x: x.toString(),
    y: y.toString(),
    permissions: permissions.sort(),
    estate: options.estate
  }
}

/**
 * Creates multiple expected permissions for testing pagination
 */
export function createExpectedPermissions(
  count: number,
  permissionType: PermissionType,
  options: {
    estateIdPrefix?: string
  } = {}
): WalletLandPermission[] {
  return Array.from({ length: count }, (_, i) => {
    const estate = options.estateIdPrefix
      ? { id: `${options.estateIdPrefix}-${Math.floor(i / 3)}`, size: 3 }
      : undefined

    return createExpectedPermission(i, i * 2, [permissionType], {
      estate
    })
  })
}
