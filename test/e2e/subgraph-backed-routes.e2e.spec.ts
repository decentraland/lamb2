import { get, LAMBDAS_URL, wallet } from './realm'

/**
 * These routes have no marketplace path: they are served from the realm's subgraphs alone. A
 * failure here points at the subgraph configuration of the realm rather than at the service.
 */
describe('when routes served only from the subgraphs are requested', () => {
  let address: string

  beforeEach(async () => {
    ;({ address } = await wallet())
  })

  describe('and the lands a wallet owns are listed', () => {
    let response: Awaited<ReturnType<typeof get<{ elements: unknown[] }>>>

    beforeEach(async () => {
      response = await get(`${LAMBDAS_URL}/users/${address}/lands?pageSize=1`)
    })

    it('should answer a page', () => {
      expect([response.status, Array.isArray(response.body?.elements)]).toEqual([200, true])
    })
  })

  describe('and every collection is listed', () => {
    let response: Awaited<ReturnType<typeof get<{ collections: unknown[] }>>>

    beforeEach(async () => {
      response = await get(`${LAMBDAS_URL}/nfts/collections`)
    })

    it('should answer the collections', () => {
      expect([response.status, Array.isArray(response.body?.collections)]).toEqual([200, true])
    })
  })

  describe('and the linked wearables a wallet owns are listed', () => {
    let response: Awaited<ReturnType<typeof get<{ elements: unknown[] }>>>

    beforeEach(async () => {
      response = await get(`${LAMBDAS_URL}/users/${address}/third-party-wearables?pageSize=1`)
    })

    it('should answer a page', () => {
      expect([response.status, Array.isArray(response.body?.elements)]).toEqual([200, true])
    })
  })
})
