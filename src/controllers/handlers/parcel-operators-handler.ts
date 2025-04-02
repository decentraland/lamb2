import { Parcel } from '@dcl/schemas'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'
import { ParcelOperators } from '../../adapters/parcel-rights-fetcher'

export async function parcelOperatorsHandler(
  context: HandlerContextWithPath<'parcelRightsFetcher' | 'logs', '/parcels/:x/:y/operators'>
): Promise<{ status: 200; body: ParcelOperators }> {
  const { x, y } = context.params
  const { parcelRightsFetcher } = context.components

  const logger = context.components.logs.getLogger('parcel-operators-handler')
  const xInt = parseInt(x)
  const yInt = parseInt(y)

  if (!Parcel.validate({ x: xInt, y: yInt })) {
    logger.error(`Invalid values for coordinates: x=${x}, y=${y}`)
    throw new InvalidRequestError('Coordinates X and Y must be valid numbers in a valid range')
  }

  const operators = await parcelRightsFetcher.getOperatorsOfParcel(xInt, yInt)

  return {
    status: 200,
    body: operators
  }
}
