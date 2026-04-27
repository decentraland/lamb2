import { createMarketplaceApiFetcherMock } from '../mocks/marketplace-api-mock'
import { testWithComponents } from '../components'
import { generateWearables } from '../data/wearables'
import { generateRandomAddress } from '../helpers'

const testWith = testWithComponents(() => {
  const wearables = generateWearables(3)
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, shouldFail: false })
  return { marketplaceApiFetcher }
})

testWith('wearables-by-owner-handler: GET /collections/wearables-by-owner/:owner', function ({ components }) {
  describe('when the owner has on-chain wearables', () => {
    it('responds 200 with urn+amount entries (no definitions by default)', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/wearables-by-owner/${generateRandomAddress()}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body).toHaveLength(3)
      for (const entry of body) {
        expect(entry).toEqual({ urn: expect.any(String), amount: expect.any(Number) })
        expect(entry).not.toHaveProperty('definition')
      }
    })
  })

  describe('when called with ?collectionId pointing at a non-third-party URN', () => {
    it('responds 400 via the error middleware', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(
        `/collections/wearables-by-owner/${generateRandomAddress()}?collectionId=urn:decentraland:off-chain:base-avatars`
      )

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ error: 'Bad request' })
    })
  })
})
