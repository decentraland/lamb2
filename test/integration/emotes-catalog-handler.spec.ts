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
    it('responds 400 via the error middleware', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/collections/emotes')

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when textSearch returns matching on-chain results', () => {
    const matchedUrn = 'urn:decentraland:matic:collections-v2:0xemote:0'

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: matchedUrn }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(matchedUrn, 'happy dance')])
    })

    it('responds 200 with the emote definition and pagination block', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/collections/emotes?textSearch=dance')

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.emotes).toHaveLength(1)
      expect(body.emotes[0]).toMatchObject({ id: matchedUrn, name: 'happy dance' })
      expect(body.filters).toEqual({ textSearch: 'dance' })
      expect(body.pagination).toMatchObject({ limit: 500 })
    })

    it('does not call the ethereum collections subgraph (emotes are L2-only)', async () => {
      const { localFetch } = components

      await localFetch.fetch('/collections/emotes?textSearch=dance')

      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })

  describe('when filtering by collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xemote'
    const matchedUrn = `${collectionId}:0`

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        collections: [{ items: [{ urn: matchedUrn }] }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(matchedUrn, 'collection emote')])
    })

    it('wraps the items query inside collections() on the L2 subgraph', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/emotes?collectionId=${encodeURIComponent(collectionId)}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.emotes.map((e: { id: string }) => e.id)).toEqual([matchedUrn])
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()] })

      const sent = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
      expect(sent).toContain('collections(where: { urn_in: $collectionIds }')
      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })

  describe('when filtering by emoteId', () => {
    const emoteId = 'urn:decentraland:matic:collections-v2:0xemote:1'

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: emoteId }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildEmoteEntity(emoteId, 'specific dance')])
    })

    it('passes urn_in to the L2 subgraph and returns just that emote', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/emotes?emoteId=${encodeURIComponent(emoteId)}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.emotes.map((e: { id: string }) => e.id)).toEqual([emoteId])
      expect(body.filters).toEqual({ itemIds: [emoteId.toLowerCase()] })

      const sent = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
      expect(sent).toContain('urn_in: $ids')
      expect(sent).toContain('emote_v1')
    })
  })
})
