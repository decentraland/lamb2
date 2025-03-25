import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'

const QUERY_OPERATOR: string = `
  query fetchOperator($address: String, $x: Int, $y: Int){
  parcels(
    where: {
      and: [
        { x: $x }
        { y: $y }
        {
          or: [
            { owner: $address }
            {
              updateOperators_: {
                address: $address
              }
            }
          ]
        }
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
    where: {
      and: [
        { parcels_: { x: $x, y: $y } }
        {
          or: [
            { owner: $address }
            {
              updateOperators_: {
                address: $address
              }
            }
          ]
        }
      ]
    }
  ) {
    owner {
      address
    }
    updateOperator
  }
}
`

export type ParcelPermissionsFromQuery = {
  parcels: [
    {
      x: string
      y: string
      owner: {
        address: string
      }
      updateOperator: string
    }
  ]
  estates: [
    {
      owner: {
        address: string
      }
      updateOperator: string
    }
  ]
}

export type ParcelPermissions = {
  owner: boolean
  operator: boolean
}

export type ParcelPermissionsFetcher = IBaseComponent & {
  getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions>
}

export async function createParcelPermissionsComponent(
  components: Pick<AppComponents, 'theGraph' | 'logs'>
): Promise<ParcelPermissionsFetcher> {
  const { theGraph, logs } = components
  const logger = logs.getLogger('parcel-permissions-component')

  return {
    async getParcelPermissions(address: string, x: number, y: number): Promise<ParcelPermissions> {
      const response = { owner: false, operator: false }
      const addressLower = address.toLowerCase()
      const result = await theGraph.landSubgraph.query<ParcelPermissionsFromQuery>(QUERY_OPERATOR, {
        addressLower,
        x,
        y
      })
      logger.info(`Parcel permissions for address ${address} at x=${x} y=${y}: ${JSON.stringify(result)}`)
      if (result.parcels.length > 0) {
        response.owner = result.parcels[0].owner.address.toLowerCase() === addressLower
        response.operator = result.parcels[0].updateOperator.toLowerCase() === addressLower
      }

      if (result.estates.length > 0) {
        response.owner = result.estates[0].owner.address.toLowerCase() === addressLower
        response.operator = result.estates[0].updateOperator.toLowerCase() === addressLower
      }

      return response
    }
  }
}
