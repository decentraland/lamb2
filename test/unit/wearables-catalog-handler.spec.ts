import { Entity, WearableDefinition } from '@dcl/schemas'
import { wearablesCatalogHandler } from '../../src/controllers/handlers/wearables-catalog-handler'
import * as fetchBaseItemsModule from '../../src/logic/fetch-elements/fetch-base-items'
import * as fetchWearablesByFiltersModule from '../../src/logic/fetch-elements/fetch-items-by-filters'
import { BaseWearable, InvalidRequestError } from '../../src/types'

describe('wearables-catalog-handler: GET /collections/wearables', () => {
  let fetchBaseSpy: jest.SpyInstance
  let fetchByFiltersSpy: jest.SpyInstance

  function buildContext(urlPath: string, fetchItemsDefinitions: jest.Mock = jest.fn().mockResolvedValue([])) {
    return {
      components: {
        theGraph: {} as any,
        wearableDefinitionsFetcher: { fetchItemsDefinitions } as any,
        entitiesFetcher: {} as any,
        contentServerUrl: 'http://content.test'
      },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  function makeBaseWearable(urn: string, name: string, englishText?: string): BaseWearable {
    const entity = {
      content: [],
      metadata: {
        id: urn,
        name,
        thumbnail: 'thumb.png',
        image: 'img.png',
        i18n: englishText ? [{ code: 'en', text: englishText }] : undefined,
        data: { representations: [], category: 'hat', tags: [], hides: [], replaces: [] }
      }
    } as unknown as Entity
    return {
      urn,
      name,
      category: 'hat' as any,
      individualData: [{ id: urn }],
      amount: 1,
      entity
    }
  }

  beforeEach(() => {
    fetchBaseSpy = jest.spyOn(fetchBaseItemsModule, 'fetchBaseWearables')
    fetchByFiltersSpy = jest.spyOn(fetchWearablesByFiltersModule, 'fetchWearablesByFilters')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no filter is provided', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext('/collections/wearables')
    })

    it('should reject with InvalidRequestError without invoking either fetcher', async () => {
      await expect(wearablesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(fetchBaseSpy).not.toHaveBeenCalled()
      expect(fetchByFiltersSpy).not.toHaveBeenCalled()
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext('/collections/wearables?textSearch=ab')
    })

    it("should reject with a 'must be at least 3 characters' InvalidRequestError", async () => {
      await expect(wearablesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 wearableIds are passed', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const ids = Array.from({ length: 501 }, (_, i) => `wearableId=urn${i}`).join('&')
      context = buildContext(`/collections/wearables?${ids}`)
    })

    it('should reject with InvalidRequestError', async () => {
      await expect(wearablesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 collectionIds are passed', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const ids = Array.from({ length: 501 }, (_, i) => `collectionId=urn${i}`).join('&')
      context = buildContext(`/collections/wearables?${ids}`)
    })

    it('should reject with InvalidRequestError', async () => {
      await expect(wearablesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when called with on-chain results only', () => {
    let definitionA: WearableDefinition
    let definitionB: WearableDefinition

    beforeEach(() => {
      definitionA = { id: 'urn:matic:a' } as WearableDefinition
      definitionB = { id: 'urn:matic:b' } as WearableDefinition
      fetchBaseSpy.mockResolvedValueOnce([])
      fetchByFiltersSpy.mockResolvedValueOnce(['urn:matic:a', 'urn:matic:b'])
    })

    describe('and no limit is provided', () => {
      let fetchItemsDefinitions: jest.Mock
      let context: ReturnType<typeof buildContext>

      beforeEach(() => {
        fetchItemsDefinitions = jest.fn().mockResolvedValueOnce([definitionA, definitionB])
        context = buildContext(
          '/collections/wearables?collectionId=URN:A&wearableId=URN:1&textSearch=Hat',
          fetchItemsDefinitions
        )
      })

      it('should pass lowercased filters and a default 500 limit (501 with overflow detection) to the fetcher', async () => {
        await wearablesCatalogHandler(context)

        expect(fetchByFiltersSpy).toHaveBeenCalledWith(
          expect.anything(),
          { collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'hat' },
          expect.objectContaining({ limit: 501, lastId: undefined })
        )
      })

      it('should resolve definitions for the returned urns and respond with the catalog body', async () => {
        const response = await wearablesCatalogHandler(context)

        expect(fetchItemsDefinitions).toHaveBeenCalledWith(['urn:matic:a', 'urn:matic:b'])
        expect(response.body.wearables).toEqual([definitionA, definitionB])
        expect(response.body.pagination).toEqual({ limit: 500, lastId: undefined, next: undefined })
      })
    })

    describe('and the limit query param is out of range', () => {
      let context: ReturnType<typeof buildContext>

      beforeEach(() => {
        context = buildContext(
          '/collections/wearables?textSearch=hat&limit=99999',
          jest.fn().mockResolvedValueOnce([definitionA, definitionB])
        )
      })

      it('should clamp the limit to 500 (501 with overflow detection)', async () => {
        await wearablesCatalogHandler(context)

        expect(fetchByFiltersSpy).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ limit: 501 })
        )
      })
    })

    describe('and the limit is within range', () => {
      let context: ReturnType<typeof buildContext>

      beforeEach(() => {
        context = buildContext(
          '/collections/wearables?textSearch=hat&limit=42',
          jest.fn().mockResolvedValueOnce([definitionA])
        )
      })

      it('should request limit+1 from the fetcher to detect more pages', async () => {
        await wearablesCatalogHandler(context)

        expect(fetchByFiltersSpy).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ limit: 43 })
        )
      })
    })
  })

  describe('when off-chain base wearables match the filter', () => {
    let baseUrn: string
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
      fetchBaseSpy.mockResolvedValueOnce([makeBaseWearable(baseUrn, 'Eyebrows', 'eyebrows english')])
      fetchByFiltersSpy.mockResolvedValueOnce([])
      context = buildContext(`/collections/wearables?wearableId=${encodeURIComponent(baseUrn)}`)
    })

    it('should return the extracted base wearable definition before any on-chain results', async () => {
      const response = await wearablesCatalogHandler(context)

      expect(response.body.wearables).toHaveLength(1)
      expect(response.body.wearables[0]).toMatchObject({ id: baseUrn, name: 'Eyebrows' })
    })
  })

  describe('when textSearch only matches the english i18n text of a base wearable', () => {
    let baseUrn: string
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      baseUrn = 'urn:decentraland:off-chain:base-avatars:bee_t_shirt'
      fetchBaseSpy.mockResolvedValueOnce([makeBaseWearable(baseUrn, 'something else', 'bee shirt translated')])
      fetchByFiltersSpy.mockResolvedValueOnce([])
      context = buildContext('/collections/wearables?textSearch=translated')
    })

    it('should still match the base wearable via its english i18n text', async () => {
      const response = await wearablesCatalogHandler(context)

      expect(response.body.wearables).toHaveLength(1)
      expect(response.body.wearables[0]).toMatchObject({ id: baseUrn })
    })
  })

  describe('when filters explicitly scope to the base avatars collection only', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
      fetchBaseSpy.mockResolvedValueOnce([makeBaseWearable(baseUrn, 'Eyebrows')])
      context = buildContext('/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars')
    })

    it('should not query the on-chain fetcher at all', async () => {
      await wearablesCatalogHandler(context)
      expect(fetchByFiltersSpy).not.toHaveBeenCalled()
    })
  })

  describe('when the lastId cursor has already advanced past base avatars', () => {
    let onChainCursor: string
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      onChainCursor = 'urn:decentraland:matic:collections-v2:0xabc:0'
      fetchByFiltersSpy.mockResolvedValueOnce([])
      context = buildContext(`/collections/wearables?textSearch=hat&lastId=${encodeURIComponent(onChainCursor)}`)
    })

    it('should skip the off-chain fetch and forward the cursor (lowercased) to the on-chain fetcher', async () => {
      await wearablesCatalogHandler(context)

      expect(fetchBaseSpy).not.toHaveBeenCalled()
      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ lastId: onChainCursor.toLowerCase() })
      )
    })
  })

  describe('when off-chain alone returns more items than the requested limit', () => {
    let baseUrns: string[]
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      baseUrns = [
        'urn:decentraland:off-chain:base-avatars:a',
        'urn:decentraland:off-chain:base-avatars:b',
        'urn:decentraland:off-chain:base-avatars:c'
      ]
      fetchBaseSpy.mockResolvedValueOnce(baseUrns.map((urn) => makeBaseWearable(urn, urn)))
      context = buildContext('/collections/wearables?textSearch=urn&limit=2')
    })

    it('should not call the on-chain fetcher', async () => {
      await wearablesCatalogHandler(context)
      expect(fetchByFiltersSpy).not.toHaveBeenCalled()
    })

    it('should slice the off-chain results to the limit and emit a next cursor pointing to the last sliced urn', async () => {
      const response = await wearablesCatalogHandler(context)

      expect(response.body.wearables).toHaveLength(2)
      expect(response.body.pagination.next).toBeDefined()
      const nextParams = new URLSearchParams(response.body.pagination.next!.slice(1))
      expect(nextParams.get('lastId')).toBe(baseUrns[1])
    })
  })

  describe('when off-chain returns some items and on-chain is queried fresh', () => {
    let baseUrns: string[]
    let onChainDefinitions: WearableDefinition[]
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      baseUrns = ['urn:decentraland:off-chain:base-avatars:a', 'urn:decentraland:off-chain:base-avatars:b']
      onChainDefinitions = [
        { id: 'urn:decentraland:matic:1' },
        { id: 'urn:decentraland:matic:2' },
        { id: 'urn:decentraland:matic:3' },
        { id: 'urn:decentraland:matic:4' }
      ] as WearableDefinition[]
      fetchBaseSpy.mockResolvedValueOnce(baseUrns.map((urn) => makeBaseWearable(urn, urn)))
      fetchByFiltersSpy.mockResolvedValueOnce(onChainDefinitions.map((d) => d.id))
      context = buildContext(
        '/collections/wearables?textSearch=urn&limit=5',
        jest.fn().mockResolvedValueOnce(onChainDefinitions)
      )
    })

    it('should call the on-chain fetcher with a cleared cursor and remaining+1 limit', async () => {
      await wearablesCatalogHandler(context)

      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ lastId: undefined, limit: 4 })
      )
    })

    it('should merge off-chain and on-chain results in order with off-chain first', async () => {
      const response = await wearablesCatalogHandler(context)

      expect(response.body.wearables).toHaveLength(5)
      const ids = response.body.wearables.map((w) => w.id)
      expect(ids.slice(0, 2)).toEqual(baseUrns)
      expect(ids.slice(2)).toEqual(onChainDefinitions.slice(0, 3).map((d) => d.id))
    })
  })

  describe('when the fetcher returns more results than the requested limit', () => {
    let definitions: WearableDefinition[]
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
      definitions = letters.map((l) => ({ id: `urn:matic:${l}` })) as WearableDefinition[]
      fetchBaseSpy.mockResolvedValueOnce([])
      fetchByFiltersSpy.mockResolvedValueOnce(definitions.map((d) => d.id))
      context = buildContext(
        '/collections/wearables?collectionId=urn:c&wearableId=urn:1&textSearch=hat&limit=10',
        jest.fn().mockResolvedValueOnce(definitions)
      )
    })

    it('should slice to the requested limit and emit a next cursor preserving every filter', async () => {
      const response = await wearablesCatalogHandler(context)

      expect(response.body.wearables).toHaveLength(10)
      const next = response.body.pagination.next
      expect(next).toBeDefined()
      const nextParams = new URLSearchParams(next!.startsWith('?') ? next!.slice(1) : next)
      expect(nextParams.getAll('collectionId')).toEqual(['urn:c'])
      expect(nextParams.getAll('wearableId')).toEqual(['urn:1'])
      expect(nextParams.get('textSearch')).toBe('hat')
      expect(nextParams.get('limit')).toBe('10')
      expect(nextParams.get('lastId')).toBe('urn:matic:j')
    })
  })
})
