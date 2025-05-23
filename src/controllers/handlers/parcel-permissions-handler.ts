import { EthAddress, Parcel } from '@dcl/schemas'
import { ParcelPermissions } from '../../adapters/parcel-rights-fetcher'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

export async function parcelPermissionsHandler(
  context: HandlerContextWithPath<'parcelRightsFetcher' | 'logs', '/users/:address/parcels/:x/:y/permissions'>
): Promise<{ status: 200; body: ParcelPermissions }> {
  const { address, x, y } = context.params
  const { parcelRightsFetcher } = context.components

  const logger = context.components.logs.getLogger('parcel-permissions-handler')
  const xInt = parseInt(x)
  const yInt = parseInt(y)

  if (!Parcel.validate({ x: xInt, y: yInt })) {
    logger.error(`Invalid values for coordinates: x=${x}, y=${y}`)
    throw new InvalidRequestError('Coordinates X and Y must be valid numbers in a valid range')
  }

  if (!EthAddress.validate(address)) {
    logger.error(`Invalid address: ${address}`)
    throw new InvalidRequestError('Address must be a valid Ethereum address')
  }

  const permissions = await parcelRightsFetcher.getParcelPermissions(address, xInt, yInt)
  return {
    status: 200,
    body: permissions
  }
}
