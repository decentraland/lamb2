import { WearableDefinition } from '@dcl/schemas'
import { wearablesCatalogHandler } from '../../src/controllers/handlers/wearables-catalog-handler'
import * as catalogModule from '../../src/logic/wearables-catalog'
import { InvalidRequestError } from '../../src/types'

describe('wearables-catalog-handler: GET /collections/wearables', () => {
  let catalogSpy: jest.SpyInstance

  beforeEach(() => {
    catalogSpy = jest.spyOn(catalogModule, 'getWearablesCatalog')
  })

  afterEach(() => {
    catalogSpy.mockRestore()
  })

  function buildContext(urlPath: string) {
    return {
      components: {
        theGraph: {} as any,
        wearableDefinitionsFetcher: {} as any,
        entitiesFetcher: {} as any
      },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  describe('when no filter is provided', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(wearablesCatalogHandler(buildContext('/collections/wearables'))).rejects.toThrow(InvalidRequestError)
      expect(catalogSpy).not.toHaveBeenCalled()
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(
        wearablesCatalogHandler(buildContext('/collections/wearables?textSearch=ab'))
      ).rejects.toThrow(InvalidRequestError)
      expect(catalogSpy).not.toHaveBeenCalled()
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

  describe('when called with valid filters', () => {
    const definitionA = { id: 'urn:a' } as WearableDefinition
    const definitionB = { id: 'urn:b' } as WearableDefinition

    beforeEach(() => {
      catalogSpy.mockResolvedValueOnce({ wearables: [definitionA, definitionB], lastId: undefined })
    })

    it('should pass lowercased filters and a default 500 limit when no limit is provided', async () => {
      const response = await wearablesCatalogHandler(
        buildContext('/collections/wearables?collectionId=URN:A&wearableId=URN:1&textSearch=Hat')
      )

      expect(catalogSpy).toHaveBeenCalledWith(
        expect.anything(),
        { collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'hat' },
        { limit: 500, lastId: undefined }
      )
      expect(response.status).toBe(200)
      expect(response.body.wearables).toEqual([definitionA, definitionB])
      expect(response.body.pagination).toEqual({ limit: 500, lastId: undefined, next: undefined })
    })

    it('should clamp out-of-range limits to 500', async () => {
      await wearablesCatalogHandler(buildContext('/collections/wearables?textSearch=hat&limit=99999'))
      expect(catalogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), { limit: 500, lastId: undefined })
    })

    it('should accept a valid limit', async () => {
      await wearablesCatalogHandler(buildContext('/collections/wearables?textSearch=hat&limit=42'))
      expect(catalogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), { limit: 42, lastId: undefined })
    })
  })

  describe('when the catalog returns more results to paginate', () => {
    beforeEach(() => {
      catalogSpy.mockResolvedValueOnce({
        wearables: [{ id: 'urn:a' } as WearableDefinition],
        lastId: 'urn:cursor'
      })
    })

    it('should produce a next cursor with the original filters preserved', async () => {
      const response = await wearablesCatalogHandler(
        buildContext('/collections/wearables?collectionId=urn:c&wearableId=urn:1&textSearch=hat&limit=10')
      )

      const next = response.body.pagination.next
      expect(next).toBeDefined()
      const nextParams = new URLSearchParams(next!.startsWith('?') ? next!.slice(1) : next)
      expect(nextParams.getAll('collectionId')).toEqual(['urn:c'])
      expect(nextParams.getAll('wearableId')).toEqual(['urn:1'])
      expect(nextParams.get('textSearch')).toBe('hat')
      expect(nextParams.get('limit')).toBe('10')
      expect(nextParams.get('lastId')).toBe('urn:cursor')
    })
  })
})
