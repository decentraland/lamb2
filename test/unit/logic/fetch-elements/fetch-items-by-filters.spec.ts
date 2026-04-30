import {
  fetchEmotesByFilters,
  fetchWearablesByFilters
} from '../../../../src/logic/fetch-elements/fetch-items-by-filters'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'

describe('fetchWearablesByFilters', () => {
  let theGraph: ReturnType<typeof createTheGraphComponentMock>
  let l1Query: jest.SpyInstance
  let l2Query: jest.SpyInstance

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
    l1Query = jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query')
    l2Query = jest.spyOn(theGraph.maticCollectionsSubgraph, 'query')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when called with a textSearch filter', () => {
    beforeEach(() => {
      l1Query.mockResolvedValueOnce({ items: [{ urn: 'urn:eth:1' }] })
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:1' }] })
    })

    it('should query both the ethereum and matic collection subgraphs', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10 })

      expect(l1Query).toHaveBeenCalledTimes(1)
      expect(l2Query).toHaveBeenCalledTimes(1)
    })

    it('should merge the L1 and L2 results in L1-first order', async () => {
      const result = await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10 })

      expect(result).toEqual(['urn:eth:1', 'urn:matic:1'])
    })

    it('should pass the textSearch and lastId variables and the searchText_contains where clause to the subgraph', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10 })

      expect(l1Query).toHaveBeenCalledWith(
        expect.stringContaining('searchText_contains: $textSearch'),
        expect.objectContaining({ textSearch: 'hat', lastId: '', first: 10 })
      )
    })
  })

  describe('when called with itemIds', () => {
    beforeEach(() => {
      l1Query.mockResolvedValueOnce({ items: [] })
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:1' }] })
    })

    it('should include urn_in in the where clause and pass the ids variable', async () => {
      await fetchWearablesByFilters(theGraph, { itemIds: ['urn:a', 'urn:b'] }, { limit: 5 })

      expect(l1Query).toHaveBeenCalledWith(
        expect.stringContaining('urn_in: $ids'),
        expect.objectContaining({ ids: ['urn:a', 'urn:b'] })
      )
    })
  })

  describe('when called with collectionIds', () => {
    beforeEach(() => {
      l1Query.mockResolvedValueOnce({
        collections: [{ items: [{ urn: 'urn:eth:1' }, { urn: 'urn:eth:2' }] }, { items: [{ urn: 'urn:eth:3' }] }]
      })
      l2Query.mockResolvedValueOnce({ collections: [] })
    })

    it('should wrap the items query inside a collections(where: {urn_in: $collectionIds}) block', async () => {
      await fetchWearablesByFilters(theGraph, { collectionIds: ['urn:c1'] }, { limit: 10 })

      expect(l1Query).toHaveBeenCalledWith(
        expect.stringContaining('collections(where: { urn_in: $collectionIds }'),
        expect.objectContaining({ collectionIds: ['urn:c1'] })
      )
    })

    it('should flatten urns from every matching collection into a single list', async () => {
      const result = await fetchWearablesByFilters(theGraph, { collectionIds: ['urn:c1'] }, { limit: 10 })

      expect(result).toEqual(['urn:eth:1', 'urn:eth:2', 'urn:eth:3'])
    })
  })

  describe('when the lastId cursor points to an L1 (ethereum) urn', () => {
    const ethCursor = 'urn:decentraland:ethereum:collections-v1:foo:bar'

    beforeEach(() => {
      l1Query.mockResolvedValueOnce({ items: [{ urn: 'urn:eth:after-cursor' }] })
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:1' }] })
    })

    it('should query L1 with the cursor', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10, lastId: ethCursor })

      expect(l1Query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ lastId: ethCursor }))
    })

    it('should query L2 with a cleared cursor once L1 returned items', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10, lastId: ethCursor })

      expect(l2Query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ lastId: '' }))
    })

    it('should merge both layers with the L1 result first', async () => {
      const result = await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10, lastId: ethCursor })

      expect(result).toEqual(['urn:eth:after-cursor', 'urn:matic:1'])
    })
  })

  describe('when the lastId cursor points to an L2 (matic) urn', () => {
    const maticCursor = 'urn:decentraland:matic:collections-v2:0xabc:0'

    beforeEach(() => {
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:after-cursor' }] })
    })

    it('should skip the L1 subgraph entirely', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10, lastId: maticCursor })

      expect(l1Query).not.toHaveBeenCalled()
    })

    it('should query L2 with the cursor and return its items', async () => {
      const result = await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10, lastId: maticCursor })

      expect(l2Query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ lastId: maticCursor }))
      expect(result).toEqual(['urn:matic:after-cursor'])
    })
  })

  describe('when L1 fills the requested limit', () => {
    beforeEach(() => {
      l1Query.mockResolvedValueOnce({ items: [{ urn: 'urn:eth:1' }, { urn: 'urn:eth:2' }] })
    })

    it('should not call the L2 subgraph', async () => {
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 2 })

      expect(l2Query).not.toHaveBeenCalled()
    })
  })

  describe('when the query restricts to wearable item types', () => {
    let queryString: string

    beforeEach(async () => {
      l1Query.mockResolvedValueOnce({ items: [] })
      l2Query.mockResolvedValueOnce({ items: [] })
      await fetchWearablesByFilters(theGraph, { textSearch: 'hat' }, { limit: 10 })
      queryString = l1Query.mock.calls[0][0] as string
    })

    it('should include searchItemType_in with every wearable type', () => {
      expect(queryString).toContain('searchItemType_in')
      expect(queryString).toContain('wearable_v1')
      expect(queryString).toContain('wearable_v2')
      expect(queryString).toContain('smart_wearable_v1')
    })

    it('should not include the emote_v1 item type', () => {
      expect(queryString).not.toContain('emote_v1')
    })
  })
})

describe('fetchEmotesByFilters', () => {
  let theGraph: ReturnType<typeof createTheGraphComponentMock>
  let l1Query: jest.SpyInstance
  let l2Query: jest.SpyInstance

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
    l1Query = jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query')
    l2Query = jest.spyOn(theGraph.maticCollectionsSubgraph, 'query')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when called with a textSearch filter', () => {
    let queryString: string

    beforeEach(async () => {
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:emote:1' }] })
      await fetchEmotesByFilters(theGraph, { textSearch: 'dance' }, { limit: 10 })
      queryString = l2Query.mock.calls[0][0] as string
    })

    it('should skip the L1 subgraph entirely', () => {
      expect(l1Query).not.toHaveBeenCalled()
    })

    it('should query the L2 subgraph exactly once', () => {
      expect(l2Query).toHaveBeenCalledTimes(1)
    })

    it('should restrict searchItemType to emote_v1 only', () => {
      expect(queryString).toContain('searchItemType_in')
      expect(queryString).toContain('emote_v1')
      expect(queryString).not.toContain('wearable_v1')
      expect(queryString).not.toContain('wearable_v2')
      expect(queryString).not.toContain('smart_wearable_v1')
    })
  })

  describe('when called with itemIds', () => {
    beforeEach(() => {
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:emote:1' }] })
    })

    it('should pass the ids variable and a urn_in where clause to the L2 subgraph', async () => {
      await fetchEmotesByFilters(theGraph, { itemIds: ['urn:e:1', 'urn:e:2'] }, { limit: 5 })

      expect(l2Query).toHaveBeenCalledWith(
        expect.stringContaining('urn_in: $ids'),
        expect.objectContaining({ ids: ['urn:e:1', 'urn:e:2'] })
      )
    })
  })

  describe('when called with collectionIds', () => {
    beforeEach(() => {
      l2Query.mockResolvedValueOnce({
        collections: [{ items: [{ urn: 'urn:matic:e:1' }, { urn: 'urn:matic:e:2' }] }]
      })
    })

    it('should wrap the items query inside a collections block on the L2 subgraph', async () => {
      await fetchEmotesByFilters(theGraph, { collectionIds: ['urn:c1'] }, { limit: 10 })

      expect(l2Query).toHaveBeenCalledWith(
        expect.stringContaining('collections(where: { urn_in: $collectionIds }'),
        expect.objectContaining({ collectionIds: ['urn:c1'] })
      )
    })

    it('should flatten urns from every matching collection into a single list', async () => {
      const result = await fetchEmotesByFilters(theGraph, { collectionIds: ['urn:c1'] }, { limit: 10 })

      expect(result).toEqual(['urn:matic:e:1', 'urn:matic:e:2'])
    })
  })

  describe('when an L2 cursor is provided', () => {
    const maticCursor = 'urn:decentraland:matic:collections-v2:0xabc:0'

    beforeEach(() => {
      l2Query.mockResolvedValueOnce({ items: [{ urn: 'urn:matic:emote:after-cursor' }] })
    })

    it('should forward the cursor as lastId to the L2 subgraph', async () => {
      await fetchEmotesByFilters(theGraph, { textSearch: 'dance' }, { limit: 10, lastId: maticCursor })

      expect(l2Query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ lastId: maticCursor }))
    })
  })
})
