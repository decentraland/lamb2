import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, ParcelOrStateNotFoundError } from '../types'
import { THE_GRAPH_PAGE_SIZE } from '../logic/fetch-elements/fetch-elements'

const QUERY_OPERATORS_PARCEL: string = `
  query fetchOperatorsOfParcel($x: Int, $y: Int){
  parcels(
    where: {
      and: [
        { x: $x }
        { y: $y }
      ]
    }
  ) {
    x
    y
    owner {
      address
    }
    updateOperator
    operator
  }
  estates(
    where: { parcels_: { x: $x, y: $y } }
  ) {
    owner {
      address
    }
    operator
    updateOperator
  }
}
`

const QUERY_AUTHORIZATIONS: string = `
  query fetchAuthorizations($address: String, $tokenAddress: String, $timestampFrom: Int) {
    authorizations(first: ${THE_GRAPH_PAGE_SIZE}, where: { owner_: { address: $address }, tokenAddress: $tokenAddress, timestamp_gt: $timestampFrom}, orderBy: timestamp, orderDirection: asc) {
      type
      operator
      isApproved
      timestamp
    }
  }
`

export type ParcelOperatorsFromQuery = {
  parcels: [
    {
      x: string
      y: string
      owner: {
        address: string
      }
      operator: string | null
      updateOperator: string | null
    }
  ]
  estates: [
    {
      owner: {
        address: string
      }
      operator: string | null
      updateOperator: string | null
    }
  ]
}

export type ParcelOperators = {
  owner: string
  operators: string[]
  updateOperators: string[]
  updateManagers: string[]
  approvedForAll: string[]
}

export type ParcelPermissions = {
  owner: boolean
  operator: boolean
  updateOperator: boolean
  updateManager: boolean
  approvedForAll: boolean
}

type AuthorizationFromQuery = {
  authorizations: Authorization[]
}

export enum AuthorizationType {
  Operator = 'Operator',
  UpdateManager = 'UpdateManager'
}

export type Authorization = {
  type: AuthorizationType
  operator: string
  isApproved: boolean
  timestamp: number
}

export type ParcelRightsFetcher = IBaseComponent & {
  getOperatorsOfParcel(x: number, y: number): Promise<ParcelOperators>
  getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions>
}

export async function createParcelRightsComponent(
  components: Pick<AppComponents, 'theGraph' | 'logs'>,
  landsContractAddress: string,
  estatesContractAddress: string
): Promise<ParcelRightsFetcher> {
  const { theGraph, logs } = components
  const logger = logs.getLogger('parcel-rights-component')

  async function getUpdateManagersAndApprovedForAllUsers(
    address: string,
    tokenAddress: string
  ): Promise<{ updateManagers: string[]; approvedForAll: string[] }> {
    const updateManagers: Map<string, boolean> = new Map()
    const approvedForAll: Map<string, boolean> = new Map()
    let timestampFrom: number = 0
    while (true) {
      const authorizations = await theGraph.landSubgraph.query<AuthorizationFromQuery>(QUERY_AUTHORIZATIONS, {
        address,
        tokenAddress,
        timestampFrom
      })

      // Go through the authorizations and set the update managers and approved for all
      // This assumes that the authorizations are sorted by timestamp in ascending order

      for (const authorization of authorizations.authorizations) {
        if (authorization.type === AuthorizationType.UpdateManager) {
          if (authorization.isApproved) {
            updateManagers.set(authorization.operator, true)
          } else {
            updateManagers.delete(authorization.operator)
          }
        } else if (authorization.type === AuthorizationType.Operator) {
          if (authorization.isApproved) {
            approvedForAll.set(authorization.operator, true)
          } else {
            approvedForAll.delete(authorization.operator)
          }
        }
      }

      const authorizationsLength = authorizations.authorizations.length

      // We've reached the end of the authorizations
      if (authorizationsLength !== THE_GRAPH_PAGE_SIZE) {
        break
      }

      // As there are more authorizations to fetch, we'll set the last timestamp as the starting point
      timestampFrom = authorizationsLength > 0 ? authorizations.authorizations[authorizationsLength - 1].timestamp : 0
    }

    return {
      updateManagers: Array.from(updateManagers.keys()),
      approvedForAll: Array.from(approvedForAll.keys())
    }
  }

  async function getOperatorsOfParcel(x: number, y: number): Promise<ParcelOperators> {
    const result = await theGraph.landSubgraph.query<ParcelOperatorsFromQuery>(QUERY_OPERATORS_PARCEL, {
      x,
      y
    })
    logger.info(`Parcel operators at x=${x} y=${y}`)

    const parcelBelongsToEstate = result.estates.length > 0

    let owner: string = ''
    const operators: Set<string> = new Set()
    const updateOperators: Set<string> = new Set()

    if (parcelBelongsToEstate) {
      owner = result.estates[0].owner.address
      if (result.estates[0].operator) {
        operators.add(result.estates[0].operator)
      }

      if (result.estates[0].updateOperator) {
        updateOperators.add(result.estates[0].updateOperator)
      }
    } else if (result.parcels.length > 0) {
      owner = result.parcels[0].owner.address
    }

    if (result.parcels.length > 0) {
      if (result.parcels[0].operator) {
        operators.add(result.parcels[0].operator)
      }

      if (result.parcels[0].updateOperator) {
        updateOperators.add(result.parcels[0].updateOperator)
      }
    }

    if (!parcelBelongsToEstate && !result.parcels.length) {
      throw new ParcelOrStateNotFoundError(x, y)
    }

    const { updateManagers, approvedForAll } = await getUpdateManagersAndApprovedForAllUsers(
      owner,
      parcelBelongsToEstate ? estatesContractAddress : landsContractAddress
    )

    logger.info(`Parcel operators at x=${x} y=${y} owner: ${owner} operators: [${Array.from(operators).join(', ')}]`)
    logger.info(`Update operators at x=${x} y=${y}: [${Array.from(updateOperators).join(', ')}]`)
    logger.info(`Update managers at x=${x} y=${y}: [${updateManagers.join(', ')}]`)
    logger.info(`Approved for all at x=${x} y=${y}: [${approvedForAll.join(', ')}]`)

    return {
      owner,
      operators: Array.from(operators),
      updateOperators: Array.from(updateOperators),
      updateManagers,
      approvedForAll
    }
  }

  async function getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions> {
    const addressLower = address.toLowerCase()
    const parcelOperators = await getOperatorsOfParcel(x, y)

    return {
      owner: parcelOperators.owner === addressLower,
      operator: parcelOperators.operators.includes(addressLower),
      updateOperator: parcelOperators.updateOperators.includes(addressLower),
      updateManager: parcelOperators.updateManagers.includes(addressLower),
      approvedForAll: parcelOperators.approvedForAll.includes(addressLower)
    }
  }

  return {
    getOperatorsOfParcel,
    getParcelPermissions
  }
}
