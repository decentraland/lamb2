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
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      response = await components.localFetch.fetch('/collections/wearables')
      body = await response.json()
    })

    it('should respond 400 with the lamb2 error-middleware shape', () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when textSearch returns matching on-chain results', () => {
    const matchedUrn = 'urn:decentraland:matic:collections-v2:0xabc:0'
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: matchedUrn }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'fancy hat')])
      response = await components.localFetch.fetch('/collections/wearables?textSearch=hat')
      body = await response.json()
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should return the matched wearable definition', () => {
      expect(body.wearables).toHaveLength(1)
      expect(body.wearables[0]).toMatchObject({ id: matchedUrn, name: 'fancy hat' })
    })

    it('should echo the textSearch filter and the default 500 limit', () => {
      expect(body.filters).toEqual({ textSearch: 'hat' })
      expect(body.pagination).toMatchObject({ limit: 500 })
    })
  })

  describe('when filtering by collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xabc'
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
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'collection hat')])
      response = await components.localFetch.fetch(
        `/collections/wearables?collectionId=${encodeURIComponent(collectionId)}`
      )
      body = await response.json()
      sentQuery = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
    })

    it('should respond 200 with the wearables from the collection', () => {
      expect(response.status).toBe(200)
      expect(body.wearables).toHaveLength(1)
      expect(body.wearables[0]).toMatchObject({ id: matchedUrn })
    })

    it('should echo the lowercased collectionId back in the response filters', () => {
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()] })
    })

    it('should wrap the items query inside a collections() block on the subgraph', () => {
      expect(sentQuery).toContain('collections(where: { urn_in: $collectionIds }')
    })
  })

  describe('when filtering by wearableId', () => {
    const wearableId = 'urn:decentraland:matic:collections-v2:0xabc:0'
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any
    let sentQuery: string

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        items: [{ urn: wearableId }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(wearableId, 'specific hat')])
      response = await components.localFetch.fetch(
        `/collections/wearables?wearableId=${encodeURIComponent(wearableId)}`
      )
      body = await response.json()
      sentQuery = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
    })

    it('should respond 200 with just the requested wearable', () => {
      expect(response.status).toBe(200)
      expect(body.wearables.map((w: { id: string }) => w.id)).toEqual([wearableId])
    })

    it('should echo the lowercased itemId back in the response filters', () => {
      expect(body.filters).toEqual({ itemIds: [wearableId.toLowerCase()] })
    })

    it('should pass urn_in to the subgraph without the collections wrapper', () => {
      expect(sentQuery).toContain('urn_in: $ids')
    })
  })

  describe('when combining textSearch with collectionId', () => {
    const collectionId = 'urn:decentraland:matic:collections-v2:0xabc'
    const matchedUrn = `${collectionId}:1`
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any
    let sentQuery: string

    beforeEach(async () => {
      ;(components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mockResolvedValue({
        collections: [{ items: [{ urn: matchedUrn }] }]
      })
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(matchedUrn, 'fancy hat')])
      response = await components.localFetch.fetch(
        `/collections/wearables?collectionId=${encodeURIComponent(collectionId)}&textSearch=hat`
      )
      body = await response.json()
      sentQuery = (components.theGraph.maticCollectionsSubgraph.query as jest.Mock).mock.calls[0][0] as string
    })

    it('should echo both filters back in the response', () => {
      expect(response.status).toBe(200)
      expect(body.filters).toEqual({ collectionIds: [collectionId.toLowerCase()], textSearch: 'hat' })
    })

    it('should apply both the collections wrapper and the searchText_contains where clause', () => {
      expect(sentQuery).toContain('collections(where: { urn_in: $collectionIds }')
      expect(sentQuery).toContain('searchText_contains: $textSearch')
    })
  })

  describe('when filtering only the off-chain base avatars collection', () => {
    const baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      components.entitiesFetcher.fetchEntities = jest
        .fn()
        .mockResolvedValue([buildWearableEntity(baseUrn, 'eyebrows')])
      response = await components.localFetch.fetch(
        '/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars'
      )
      body = await response.json()
    })

    it('should respond 200 with the off-chain wearable', () => {
      expect(response.status).toBe(200)
      expect(body.wearables.map((w: { id: string }) => w.id)).toEqual([baseUrn])
    })

    it('should not query either collection subgraph', () => {
      expect(components.theGraph.ethereumCollectionsSubgraph.query).not.toHaveBeenCalled()
      expect(components.theGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
    })
  })
})
