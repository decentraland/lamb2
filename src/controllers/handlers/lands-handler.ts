import { LAND, LANDsFetcherError, LANDsFetcherErrorCode } from '../../adapters/lands-fetcher'
import { paginationObject } from '../../logic/utils'
import { ErrorResponse, HandlerContextWithPath, PaginatedResponse } from '../../types'

export async function landsHandler(
  context: HandlerContextWithPath<'landsFetcher' | 'logs', '/users/:address/lands'>
): Promise<PaginatedResponse<LAND> | ErrorResponse> {
  const { address } = context.params
  const { landsFetcher, logs } = context.components
  const pagination = paginationObject(context.url)
  const logger = logs.getLogger('lands-handler')

  try {
    const { lands, totalAmount } = await landsFetcher.fetchByOwner(address, pagination)
    return {
      status: 200,
      body: {
        elements: lands,
        totalAmount,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      }
    }
  } catch (err: any) {
    if (err instanceof LANDsFetcherError) {
      switch (err.code) {
        case LANDsFetcherErrorCode.CANNOT_FETCH_LANDS: {
          return {
            status: 502,
            body: {
              error: 'Cannot fetch lands right now'
            }
          }
        }
      }
    } else {
      logger.error(err)
      return {
        status: 500,
        body: {
          error: 'Internal Server Error'
        }
      }
    }
  }
}
