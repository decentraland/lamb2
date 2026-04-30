import { Emote, EmoteCategory, Entity, EntityType } from '@dcl/schemas'
import { test } from '../components'

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

test('emotes-catalog-handler: GET /collections/emotes', function ({ components }) {
  beforeEach(() => {
    jest.spyOn(components.theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({ items: [] })
    jest.spyOn(components.theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({ items: [] })
    components.content.fetchEntitiesByPointers = jest.fn().mockResolvedValue([])
  })

  describe('when no filter is provided', () => {
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      response = await components.localFetch.fetch('/collections/emotes')
      body = await response.json()
    })

    it('should respond 400 with the lamb2 error-middleware shape', () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when textSearch returns matching on-chain results', () => {
    const matchedUrn = 'urn:decentraland:matic:collections-v2:0xemote:0'
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: matchedUrn }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(matchedUrn, 'happy dance')])
      response = await components.localFetch.fetch('/collections/emotes?textSearch=dance')
      body = await response.json()
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should return the matched emote definition', () => {
      expect(body.emotes).toHaveLength(1)
      expect(body.emotes[0]).toMatchObject({ id: matchedUrn, name: 'happy dance' })
    })

    it('should echo the textSearch filter and the default 500 limit', () => {
      expect(body.filters).toEqual({ textSearch: 'dance' })
      expect(body.pagination).toMatchObject({ limit: 500 })
    })

    it('should not query the ethereum collections subgraph', () => {
      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })

  describe('when filtering by collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xemote'
    const matchedUrn = `${collectionId}:0`
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any
    let sentQuery: string

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        collections: [{ items: [{ urn: matchedUrn }] }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(matchedUrn, 'collection emote')])
      response = await components.localFetch.fetch(
        `/collections/emotes?collectionId=${encodeURIComponent(collectionId)}`
      )
      body = await response.json()
      sentQuery = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
    })

    it('should respond 200 with the emotes from the collection', () => {
      expect(response.status).toBe(200)
      expect(body.emotes.map((e: { id: string }) => e.id)).toEqual([matchedUrn])
    })

    it('should echo the lowercased collectionId back in the response filters', () => {
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()] })
    })

    it('should wrap the items query inside a collections() block on the L2 subgraph only', () => {
      expect(sentQuery).toContain('collections(where: { urn_in: $collectionIds }')
      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })

  describe('when filtering by emoteId', () => {
    const emoteId = 'urn:decentraland:matic:collections-v2:0xemote:1'
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any
    let sentQuery: string

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: emoteId }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(emoteId, 'specific dance')])
      response = await components.localFetch.fetch(`/collections/emotes?emoteId=${encodeURIComponent(emoteId)}`)
      body = await response.json()
      sentQuery = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
    })

    it('should respond 200 with just the requested emote', () => {
      expect(response.status).toBe(200)
      expect(body.emotes.map((e: { id: string }) => e.id)).toEqual([emoteId])
    })

    it('should echo the lowercased itemId back in the response filters', () => {
      expect(body.filters).toEqual({ itemIds: [emoteId.toLowerCase()] })
    })

    it('should pass urn_in and the emote_v1 type restriction to the L2 subgraph', () => {
      expect(sentQuery).toContain('urn_in: $ids')
      expect(sentQuery).toContain('emote_v1')
    })
  })
})
