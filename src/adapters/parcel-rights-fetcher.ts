import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'

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
  }
  estates(
    where: { parcels_: { x: $x, y: $y } }
  ) {
    owner {
      address
    }
    updateOperator
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
      updateOperator: string | null
    }
  ]
  estates: [
    {
      owner: {
        address: string
      }
      updateOperator: string | null
    }
  ]
}

export type ParcelOperators = {
  owner: string
  operator?: string
}

export type ParcelPermissions = {
  owner: boolean
  operator: boolean
}

export type ParcelRightsFetcher = IBaseComponent & {
  getOperatorsOfParcel(x: number, y: number): Promise<ParcelOperators>
  getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions>
}

export async function createParcelRightsComponent(
  components: Pick<AppComponents, 'theGraph' | 'logs'>
): Promise<ParcelRightsFetcher> {
  const { theGraph, logs } = components
  const logger = logs.getLogger('parcel-rights-component')

  return {
    async getOperatorsOfParcel(x: number, y: number): Promise<ParcelOperators> {
      let response: ParcelOperators
      const result = await theGraph.landSubgraph.query<ParcelOperatorsFromQuery>(QUERY_OPERATORS_PARCEL, {
        x,
        y
      })
      logger.info(`Parcel operators at x=${x} y=${y}: ${JSON.stringify(result)}`)
      if (result.parcels.length > 0) {
        response = {
          owner: result.parcels[0].owner.address,
          operator: result.parcels[0].updateOperator ?? undefined
        }
      }

      if (result.estates.length > 0) {
        response = {
          owner: result.estates[0].owner.address,
          operator: result.estates[0].updateOperator ?? undefined
        }
      }

      if (response!.operator === undefined) {
        delete response!.operator
      }
      return response!
    },
    async getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions> {
      const response = { owner: false, operator: false }
      const addressLower = address.toLowerCase()
      const result = await theGraph.landSubgraph.query<ParcelOperatorsFromQuery>(QUERY_OPERATORS_PARCEL, {
        x,
        y
      })
      logger.info(`Parcel permissions for address ${address} at x=${x} y=${y}: ${JSON.stringify(result)}`)
      if (result.parcels.length > 0) {
        response.owner = result.parcels[0].owner.address.toLowerCase() === addressLower
        response.operator = result.parcels[0].updateOperator?.toLowerCase() === addressLower
      }

      if (result.estates.length > 0) {
        response.owner = result.estates[0].owner.address.toLowerCase() === addressLower
        response.operator = result.estates[0].updateOperator?.toLowerCase() === addressLower
      }

      return response
    }
  }
}
