import { WalletLandPermission, PermissionType } from '../../src/types'

/**
 * Graph query result types matching the structure from fetchUserLandsPermissions
 */
type SubgraphParcel = {
  x: string
  y: string
  owner: { id: string } | null
  updateOperator: string | null
  operator: string | null
}

export type GraphQueryResult = {
  parcels: SubgraphParcel[]
}

/**
 * Helper to create a basic parcel structure
 */
function createParcel(x: number, y: number, owner: string | null = null): SubgraphParcel {
  return {
    x: x.toString(),
    y: y.toString(),
    owner: owner ? { id: owner } : null,
    updateOperator: null,
    operator: null
  }
}

/**
 * Creates an empty graph query result (no permissions)
 */
export function createEmptyGraphResult(): GraphQueryResult {
  return {
    parcels: []
  }
}

/**
 * Creates a graph result with direct parcel ownership
 */
export function createOwnerGraphResult(ownerAddress: string, parcelCount: number = 1): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => createParcel(i, i * 2, ownerAddress.toLowerCase()))

  return {
    parcels
  }
}

/**
 * Creates a graph result with updateOperator permissions
 */
export function createUpdateOperatorGraphResult(
  operatorAddress: string,
  ownerAddress: string,
  parcelCount: number = 1
): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => ({
    ...createParcel(i, i * 2, ownerAddress.toLowerCase()),
    updateOperator: operatorAddress.toLowerCase()
  }))

  return {
    parcels
  }
}

/**
 * Creates a graph result with operator permissions
 */
export function createOperatorGraphResult(
  operatorAddress: string,
  ownerAddress: string,
  parcelCount: number = 1
): GraphQueryResult {
  const parcels = Array.from({ length: parcelCount }, (_, i) => ({
    ...createParcel(i, i * 2, ownerAddress.toLowerCase()),
    operator: operatorAddress.toLowerCase()
  }))

  return {
    parcels
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
    includeUpdateOperator?: boolean
    includeOperator?: boolean
  }
): GraphQueryResult {
  const parcel = createParcel(0, 0, options.includeOwner ? userAddress.toLowerCase() : ownerAddress.toLowerCase())

  // Add updateOperator permission
  if (options.includeUpdateOperator) {
    parcel.updateOperator = userAddress.toLowerCase()
  }

  // Add operator permission
  if (options.includeOperator) {
    parcel.operator = userAddress.toLowerCase()
  }

  return {
    parcels: [parcel]
  }
}

/**
 * Creates expected WalletLandPermission response
 */
export function createExpectedPermission(
  x: number,
  y: number,
  permissions: PermissionType[],
  owner: string | null = null
): WalletLandPermission {
  return {
    x: x.toString(),
    y: y.toString(),
    permissions: permissions.sort(),
    owner
  }
}

/**
 * Creates multiple expected permissions for testing pagination
 */
export function createExpectedPermissions(
  count: number,
  permissionType: PermissionType,
  owner: string | null = null
): WalletLandPermission[] {
  return Array.from({ length: count }, (_, i) => {
    return createExpectedPermission(i, i * 2, [permissionType], owner)
  })
}

// Legacy function names for backward compatibility - marked as deprecated
/** @deprecated Use createEstateOwnerGraphResult instead */
export function createEstateOwnerGraphResult(
  ownerAddress: string,
  _estateCount: number = 1,
  parcelsPerEstate: number = 3
): GraphQueryResult {
  // This now just creates regular owner permissions, as estates are no longer tracked separately
  return createOwnerGraphResult(ownerAddress, parcelsPerEstate)
}

/** @deprecated Use createUpdateOperatorGraphResult instead */
export function createEstateUpdateOperatorGraphResult(
  operatorAddress: string,
  ownerAddress: string,
  _estateCount: number = 1,
  parcelsPerEstate: number = 3
): GraphQueryResult {
  // This now just creates regular updateOperator permissions
  return createUpdateOperatorGraphResult(operatorAddress, ownerAddress, parcelsPerEstate)
}

/** @deprecated Use createOperatorGraphResult instead */
export function createUpdateManagerGraphResult(
  managerAddress: string,
  ownerAddress: string,
  parcelCount: number = 1
): GraphQueryResult {
  // This now creates operator permissions
  return createOperatorGraphResult(managerAddress, ownerAddress, parcelCount)
}
