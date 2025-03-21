import { EthAddress } from '@dcl/schemas'
import { ParcelPermissions } from '../../adapters/parcel-permissions-fetcher'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

export async function parcelPermissionsHandler(
  context: HandlerContextWithPath<'parcelPermissionsFetcher' | 'logs', '/users/:address/parcels/:x/:y/permissions'>
): Promise<{ status: 200; body: ParcelPermissions }> {
  const { address, x, y } = context.params
  const { parcelPermissionsFetcher } = context.components

  const logger = context.components.logs.getLogger('parcel-permissions-handler')

  if (isNaN(parseInt(x)) || isNaN(parseInt(y))) {
    logger.error(`Invalid values for coordinates: x=${x}, y=${y}`)
    throw new InvalidRequestError('Coordinates X and Y must be valid numbers')
  }

  if (!EthAddress.validate(address)) {
    logger.error(`Invalid address: ${address}`)
    throw new InvalidRequestError('Address must be a valid Ethereum address')
  }

  const fetcher = await parcelPermissionsFetcher.getParcelPermissions(address, parseInt(x), parseInt(y))
  return {
    status: 200,
    body: fetcher
  }
}
