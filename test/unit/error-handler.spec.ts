import { errorHandler } from '../../src/controllers/handlers/errorHandler'
import { FetcherError } from '../../src/adapters/elements-fetcher'
import { ServiceOverloadedError } from '../../src/types'

describe('when a handler fails', () => {
  let ctx: any
  let response: { status?: number; body?: unknown }

  beforeEach(() => {
    ctx = { url: new URL('http://localhost/users/0x1/wearables') }
  })

  describe('and the failure is shed load', () => {
    beforeEach(async () => {
      response = await errorHandler(ctx, async () => {
        throw new ServiceOverloadedError('bulkhead saturated')
      })
    })

    it('should answer 503 so the client knows to retry', () => {
      expect(response.status).toBe(503)
    })
  })

  describe('and the failure is an upstream fetch error', () => {
    beforeEach(async () => {
      response = await errorHandler(ctx, async () => {
        throw new FetcherError('upstream down')
      })
    })

    it('should keep answering 502', () => {
      expect(response.status).toBe(502)
    })
  })
})
