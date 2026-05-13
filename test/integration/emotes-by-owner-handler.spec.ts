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
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      address = generateRandomAddress()
      response = await components.localFetch.fetch(`/collections/emotes-by-owner/${address}`)
      body = await response.json()
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should return one urn+amount entry per owned emote and omit the definition field', () => {
      expect(body).toHaveLength(2)
      for (const entry of body) {
        expect(entry).toEqual({ urn: expect.any(String), amount: expect.any(Number) })
        expect(entry).not.toHaveProperty('definition')
      }
    })
  })

  describe('when called with ?collectionId pointing at a non-third-party URN', () => {
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      address = generateRandomAddress()
      response = await components.localFetch.fetch(
        `/collections/emotes-by-owner/${address}?collectionId=urn:decentraland:matic:collections-v2:0xabc:0`
      )
      body = await response.json()
    })

    it('should respond 400 with the lamb2 error-middleware shape', () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when called with ?includeDefinitions', () => {
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: Array<{ urn: string; amount: number; definition?: { id: string; name: string } }>

    beforeEach(async () => {
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockImplementation(async (urns: string[]) => urns.map((urn) => buildEmoteEntity(urn, `def-${urn}`)))
      address = generateRandomAddress()
      response = await components.localFetch.fetch(`/collections/emotes-by-owner/${address}?includeDefinitions`)
      body = (await response.json()) as typeof body
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should attach an emote definition resolved from the content client to each entry', () => {
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
