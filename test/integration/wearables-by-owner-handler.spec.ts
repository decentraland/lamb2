import { Entity, EntityType, Wearable, WearableCategory } from '@dcl/schemas'
import { createMarketplaceApiFetcherMock } from '../mocks/marketplace-api-mock'
import { testWithComponents } from '../components'
import { generateWearables } from '../data/wearables'
import { generateRandomAddress } from '../helpers'

function buildWearableEntity(urn: string, name: string): Entity {
  return {
    version: 'v3',
    id: 'bafkreig' + urn,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: 0,
    content: [],
    metadata: {
      id: urn,
      name,
      description: '',
      i18n: [{ code: 'en', text: name }],
      thumbnail: 'thumb.png',
      image: 'img.png',
      data: { tags: [], category: WearableCategory.HAT, hides: [], replaces: [], representations: [] }
    } as Wearable
  }
}

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

  describe('when called with ?includeDefinitions', () => {
    beforeEach(() => {
      // wearableDefinitionsFetcher resolves URNs through the content client.
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockImplementation(async (urns: string[]) => urns.map((urn) => buildWearableEntity(urn, `def-${urn}`)))
    })

    it('attaches a definition to each entry', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/wearables-by-owner/${generateRandomAddress()}?includeDefinitions`)

      expect(r.status).toBe(200)
      const body = (await r.json()) as Array<{ urn: string; amount: number; definition?: { id: string; name: string } }>
      expect(body).toHaveLength(3)
      for (const entry of body) {
        expect(entry).toMatchObject({
          urn: expect.any(String),
          amount: expect.any(Number),
          definition: expect.objectContaining({ id: entry.urn, name: `def-${entry.urn}` })
        })
      }
    })
  })
})
