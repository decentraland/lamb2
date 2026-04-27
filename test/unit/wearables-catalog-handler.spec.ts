import { Entity, WearableDefinition } from '@dcl/schemas'
import { wearablesCatalogHandler } from '../../src/controllers/handlers/wearables-catalog-handler'
import * as fetchBaseItemsModule from '../../src/logic/fetch-elements/fetch-base-items'
import * as fetchWearablesByFiltersModule from '../../src/logic/fetch-elements/fetch-items-by-filters'
import { BaseWearable, InvalidRequestError } from '../../src/types'

describe('wearables-catalog-handler: GET /collections/wearables', () => {
  let fetchBaseSpy: jest.SpyInstance
  let fetchByFiltersSpy: jest.SpyInstance

  beforeEach(() => {
    fetchBaseSpy = jest.spyOn(fetchBaseItemsModule, 'fetchBaseWearables')
    fetchByFiltersSpy = jest.spyOn(fetchWearablesByFiltersModule, 'fetchWearablesByFilters')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  function buildContext(
    urlPath: string,
    fetchItemsDefinitions: jest.Mock = jest.fn().mockResolvedValue([])
  ) {
    return {
      components: {
        theGraph: {} as any,
        wearableDefinitionsFetcher: {
          fetchItemsDefinitions
        } as any,
        entitiesFetcher: {} as any
      },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  function makeBaseWearable(urn: string, name: string, englishText?: string): BaseWearable {
    const entity = {
      metadata: {
        id: urn,
        name,
        i18n: englishText ? [{ code: 'en', text: englishText }] : undefined
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

  describe('when no filter is provided', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(wearablesCatalogHandler(buildContext('/collections/wearables'))).rejects.toThrow(InvalidRequestError)
      expect(fetchBaseSpy).not.toHaveBeenCalled()
      expect(fetchByFiltersSpy).not.toHaveBeenCalled()
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(
        wearablesCatalogHandler(buildContext('/collections/wearables?textSearch=ab'))
      ).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 wearableIds are passed', () => {
    it('should throw InvalidRequestError', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => `wearableId=urn${i}`).join('&')
      await expect(wearablesCatalogHandler(buildContext(`/collections/wearables?${ids}`))).rejects.toThrow(
        InvalidRequestError
      )
    })
  })

  describe('when more than 500 collectionIds are passed', () => {
    it('should throw InvalidRequestError', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => `collectionId=urn${i}`).join('&')
      await expect(wearablesCatalogHandler(buildContext(`/collections/wearables?${ids}`))).rejects.toThrow(
        InvalidRequestError
      )
    })
  })

  describe('when called with on-chain results only', () => {
    const definitionA = { id: 'urn:matic:a' } as WearableDefinition
    const definitionB = { id: 'urn:matic:b' } as WearableDefinition

    beforeEach(() => {
      fetchBaseSpy.mockResolvedValueOnce([])
      fetchByFiltersSpy.mockResolvedValueOnce(['urn:matic:a', 'urn:matic:b'])
    })

    it('should pass lowercased filters and a default 500 limit to the fetcher', async () => {
      const fetchItemsDefinitions = jest.fn().mockResolvedValueOnce([definitionA, definitionB])
      const response = await wearablesCatalogHandler(
        buildContext('/collections/wearables?collectionId=URN:A&wearableId=URN:1&textSearch=Hat', fetchItemsDefinitions)
      )

      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        { collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'hat' },
        expect.objectContaining({ limit: 501, lastId: undefined })
      )
      expect(fetchItemsDefinitions).toHaveBeenCalledWith(['urn:matic:a', 'urn:matic:b'])
      expect(response.body.wearables).toEqual([definitionA, definitionB])
      expect(response.body.pagination).toEqual({ limit: 500, lastId: undefined, next: undefined })
    })

    it('should clamp out-of-range limits to 500', async () => {
      await wearablesCatalogHandler(
        buildContext(
          '/collections/wearables?textSearch=hat&limit=99999',
          jest.fn().mockResolvedValueOnce([definitionA, definitionB])
        )
      )
      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ limit: 501 })
      )
    })

    it('should accept a valid limit and request limit+1 from the fetcher to detect more pages', async () => {
      await wearablesCatalogHandler(
        buildContext('/collections/wearables?textSearch=hat&limit=42', jest.fn().mockResolvedValueOnce([definitionA]))
      )
      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ limit: 43 })
      )
    })
  })

  describe('when off-chain base wearables match the filter', () => {
    const baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    const baseWearable = makeBaseWearable(baseUrn, 'Eyebrows', 'eyebrows english')

    beforeEach(() => {
      fetchBaseSpy.mockResolvedValueOnce([baseWearable])
      fetchByFiltersSpy.mockResolvedValueOnce([])
    })

    it('should return the base wearable definition before any on-chain results', async () => {
      const response = await wearablesCatalogHandler(
        buildContext(`/collections/wearables?wearableId=${encodeURIComponent(baseUrn)}`)
      )

      expect(response.body.wearables).toEqual([baseWearable.entity.metadata])
    })
  })

  describe('when textSearch only matches the english i18n text of a base wearable', () => {
    const baseUrn = 'urn:decentraland:off-chain:base-avatars:bee_t_shirt'
    const baseWearable = makeBaseWearable(baseUrn, 'something else', 'bee shirt translated')

    beforeEach(() => {
      fetchBaseSpy.mockResolvedValueOnce([baseWearable])
      fetchByFiltersSpy.mockResolvedValueOnce([])
    })

    it('should still match the base wearable via its english i18n text', async () => {
      const response = await wearablesCatalogHandler(buildContext('/collections/wearables?textSearch=translated'))

      expect(response.body.wearables).toEqual([baseWearable.entity.metadata])
    })
  })

  describe('when filters explicitly scope to the base avatars collection only', () => {
    const baseUrn = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    const baseWearable = makeBaseWearable(baseUrn, 'Eyebrows')

    beforeEach(() => {
      fetchBaseSpy.mockResolvedValueOnce([baseWearable])
    })

    it('should not query the on-chain subgraph at all', async () => {
      await wearablesCatalogHandler(
        buildContext('/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars')
      )
      expect(fetchByFiltersSpy).not.toHaveBeenCalled()
    })
  })

  describe('when the lastId cursor has already advanced past base avatars', () => {
    const onChainCursor = 'urn:decentraland:matic:collections-v2:0xabc:0'

    beforeEach(() => {
      fetchByFiltersSpy.mockResolvedValueOnce([])
    })

    it('should skip the off-chain fetch entirely', async () => {
      await wearablesCatalogHandler(
        buildContext(`/collections/wearables?textSearch=hat&lastId=${encodeURIComponent(onChainCursor)}`)
      )

      expect(fetchBaseSpy).not.toHaveBeenCalled()
      expect(fetchByFiltersSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ lastId: onChainCursor.toLowerCase() })
      )
    })
  })

  describe('when the fetcher returns more results than the requested limit', () => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
    const definitions = letters.map((l) => ({ id: `urn:matic:${l}` })) as WearableDefinition[]

    beforeEach(() => {
      fetchBaseSpy.mockResolvedValueOnce([])
      fetchByFiltersSpy.mockResolvedValueOnce(definitions.map((d) => d.id))
    })

    it('should slice to the limit and return a next cursor preserving the filters', async () => {
      const response = await wearablesCatalogHandler(
        buildContext(
          '/collections/wearables?collectionId=urn:c&wearableId=urn:1&textSearch=hat&limit=10',
          jest.fn().mockResolvedValueOnce(definitions)
        )
      )

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
