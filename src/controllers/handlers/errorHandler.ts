import { IHttpServerComponent } from '@well-known-components/interfaces'
import { InvalidRequestError } from '../../types'
import { FetcherError } from '../../adapters/elements-fetcher'

export async function errorHandler(
  ctx: IHttpServerComponent.DefaultContext<object>,
  next: () => Promise<IHttpServerComponent.IResponse>
): Promise<IHttpServerComponent.IResponse> {
  try {
    return await next()
  } catch (error: any) {
    if (error instanceof InvalidRequestError) {
      return Promise.resolve({
        status: 400,
        body: {
          error: 'Bad request',
          message: error.message
        }
      })
    }

    if (error instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'The requested items cannot be fetched right now',
          message: error.message
        }
      }
    }

    console.log(`Error handling ${ctx.url.toString()}: ${error.message}`, error)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}
