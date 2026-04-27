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
})
