import { Emote, EmoteCategory, Entity, EntityType } from '@dcl/schemas'
import { createMarketplaceApiFetcherMock } from '../mocks/marketplace-api-mock'
import { testWithComponents } from '../components'
import { generateEmotes } from '../data/emotes'
import { generateRandomAddress } from '../helpers'

function buildEmoteEntity(urn: string, name: string): Entity {
  return {
    version: 'v3',
    id: 'bafkreig' + urn,
    type: EntityType.EMOTE,
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
      emoteDataADR74: { tags: [], category: EmoteCategory.DANCE, representations: [], loop: false }
    } as unknown as Emote
  }
}

const testWith = testWithComponents(() => {
  const emotes = generateEmotes(2)
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ emotes, shouldFail: false })
  return { marketplaceApiFetcher }
})

testWith('emotes-by-owner-handler: GET /collections/emotes-by-owner/:owner', function ({ components }) {
  describe('when the owner has on-chain emotes', () => {
    it('responds 200 with urn+amount entries (no definitions by default)', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/emotes-by-owner/${generateRandomAddress()}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body).toHaveLength(2)
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
        `/collections/emotes-by-owner/${generateRandomAddress()}?collectionId=urn:decentraland:matic:collections-v2:0xabc:0`
      )

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when called with ?includeDefinitions', () => {
    beforeEach(() => {
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockImplementation(async (urns: string[]) => urns.map((urn) => buildEmoteEntity(urn, `def-${urn}`)))
    })

    it('attaches an emote definition to each entry', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/emotes-by-owner/${generateRandomAddress()}?includeDefinitions`)

      expect(r.status).toBe(200)
      const body = (await r.json()) as Array<{ urn: string; amount: number; definition?: { id: string; name: string } }>
      expect(body).toHaveLength(2)
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
