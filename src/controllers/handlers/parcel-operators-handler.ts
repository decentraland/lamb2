import { Parcel } from '@dcl/schemas'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'
import { ParcelOperators } from '../../adapters/parcel-operators-fetcher'

export async function parcelOperatorsHandler(
  context: HandlerContextWithPath<'parcelOperatorsFetcher' | 'logs', '/parcels/:x/:y/operators'>
): Promise<{ status: 200; body: ParcelOperators }> {
  const { x, y } = context.params
  const { parcelOperatorsFetcher } = context.components

  const logger = context.components.logs.getLogger('parcel-operators-handler')
  const xInt = parseInt(x)
  const yInt = parseInt(y)

  if (!Parcel.validate({ x: xInt, y: yInt })) {
    logger.error(`Invalid values for coordinates: x=${x}, y=${y}`)
    throw new InvalidRequestError('Coordinates X and Y must be valid numbers in a valid range')
  }

  const operators = await parcelOperatorsFetcher.getOperatorsOfParcel(xInt, yInt)

  return {
    status: 200,
    body: operators
  }
}
