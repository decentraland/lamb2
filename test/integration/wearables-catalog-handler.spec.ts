import { Entity, EntityType, Wearable, WearableCategory } from '@dcl/schemas'
import { test } from '../components'

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

test('wearables-catalog-handler: GET /collections/wearables', function ({ components }) {
  beforeEach(() => {
    jest.spyOn(components.theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({ items: [] })
    jest.spyOn(components.theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({ items: [] })
    components.content.fetchEntitiesByPointers = jest.fn().mockResolvedValue([])
  })

  describe('when no filter is provided', () => {
    it('responds 400 via the error middleware', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/collections/wearables')

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when textSearch returns matching on-chain results', () => {
    const matchedUrn = 'urn:decentraland:matic:collections-v2:0xabc:0'

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: matchedUrn }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'fancy hat')])
    })

    it('responds 200 with the wearable definition and pagination block', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/collections/wearables?textSearch=hat')

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.wearables).toHaveLength(1)
      expect(body.wearables[0]).toMatchObject({ id: matchedUrn, name: 'fancy hat' })
      expect(body.filters).toEqual({ textSearch: 'hat' })
      expect(body.pagination).toMatchObject({ limit: 500 })
    })
  })

  describe('when filtering by collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xabc'
    const matchedUrn = `${collectionId}:0`

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        collections: [{ items: [{ urn: matchedUrn }] }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'collection hat')])
    })

    it('wraps the items query inside collections() and returns the matching wearables', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/wearables?collectionId=${encodeURIComponent(collectionId)}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.wearables).toHaveLength(1)
      expect(body.wearables[0]).toMatchObject({ id: matchedUrn })
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()] })

      const sent = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
      expect(sent).toContain('collections(where: { urn_in: $collectionIds }')
    })
  })

  describe('when filtering by wearableId', () => {
    const wearableId = 'urn:decentraland:matic:collections-v2:0xabc:0'

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: wearableId }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(wearableId, 'specific hat')])
    })

    it('passes urn_in to the subgraph and returns just that wearable', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/collections/wearables?wearableId=${encodeURIComponent(wearableId)}`)

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.wearables.map((w: { id: string }) => w.id)).toEqual([wearableId])
      expect(body.filters).toEqual({ itemIds: [wearableId.toLowerCase()] })

      const sent = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
      expect(sent).toContain('urn_in: $ids')
    })
  })

  describe('when combining textSearch with collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xabc'
    const matchedUrn = `${collectionId}:1`

    beforeEach(() => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        collections: [{ items: [{ urn: matchedUrn }] }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'fancy hat')])
    })

    it('echoes both filters back and applies them to the subgraph query', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(
        `/collections/wearables?collectionId=${encodeURIComponent(collectionId)}&textSearch=hat`
      )

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()], textSearch: 'hat' })

      const sent = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
      expect(sent).toContain('collections(where: { urn_in: $collectionIds }')
      expect(sent).toContain('searchText_contains: $textSearch')
    })
  })

  describe('when filtering only the off-chain base avatars collection', () => {
    const baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'

    beforeEach(() => {
      components.entitiesFetcher.fetchEntities = jest.fn().mockResolvedValue([buildWearableEntity(baseUrn, 'eyebrows')])
    })

    it('serves the wearable from the off-chain source without hitting any collection subgraph', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars')

      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.wearables.map((w: { id: string }) => w.id)).toEqual([baseUrn])
      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(components.theGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })
})
