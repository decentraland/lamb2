import { EmoteDefinition } from '@dcl/schemas'
import { emotesCatalogHandler } from '../../src/controllers/handlers/emotes-catalog-handler'
import * as itemsByFiltersModule from '../../src/logic/fetch-elements/fetch-items-by-filters'
import { InvalidRequestError } from '../../src/types'

describe('emotes-catalog-handler: GET /collections/emotes', () => {
  let fetchEmotesSpy: jest.SpyInstance

  beforeEach(() => {
    fetchEmotesSpy = jest.spyOn(itemsByFiltersModule, 'fetchEmotesByFilters')
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
        emoteDefinitionsFetcher: {
          fetchItemsDefinitions
        } as any
      },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  describe('when no filter is provided', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(emotesCatalogHandler(buildContext('/collections/emotes'))).rejects.toThrow(InvalidRequestError)
      expect(fetchEmotesSpy).not.toHaveBeenCalled()
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    it('should throw InvalidRequestError', async () => {
      await expect(emotesCatalogHandler(buildContext('/collections/emotes?textSearch=ab'))).rejects.toThrow(
        InvalidRequestError
      )
    })
  })

  describe('when more than 500 emoteIds are passed', () => {
    it('should throw InvalidRequestError', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => `emoteId=urn${i}`).join('&')
      await expect(emotesCatalogHandler(buildContext(`/collections/emotes?${ids}`))).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 collectionIds are passed', () => {
    it('should throw InvalidRequestError', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => `collectionId=urn${i}`).join('&')
      await expect(emotesCatalogHandler(buildContext(`/collections/emotes?${ids}`))).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when called with valid filters', () => {
    const definitionA = { id: 'urn:matic:e:a' } as EmoteDefinition
    const definitionB = { id: 'urn:matic:e:b' } as EmoteDefinition

    beforeEach(() => {
      fetchEmotesSpy.mockResolvedValueOnce(['urn:matic:e:a', 'urn:matic:e:b'])
    })

    it('should pass lowercased filters and request limit+1 to detect more pages', async () => {
      const fetchItemsDefinitions = jest.fn().mockResolvedValueOnce([definitionA, definitionB])
      const response = await emotesCatalogHandler(
        buildContext('/collections/emotes?collectionId=URN:A&emoteId=URN:1&textSearch=Dance', fetchItemsDefinitions)
      )

      expect(fetchEmotesSpy).toHaveBeenCalledWith(
        expect.anything(),
        { collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'dance' },
        expect.objectContaining({ limit: 501, lastId: undefined })
      )
      expect(fetchItemsDefinitions).toHaveBeenCalledWith(['urn:matic:e:a', 'urn:matic:e:b'])
      expect(response.body.emotes).toEqual([definitionA, definitionB])
      expect(response.body.pagination).toEqual({ limit: 500, lastId: undefined, next: undefined })
    })
  })

  describe('when the fetcher returns more results than the requested limit', () => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
    const definitions = letters.map((l) => ({ id: `urn:matic:e:${l}` })) as EmoteDefinition[]

    beforeEach(() => {
      fetchEmotesSpy.mockResolvedValueOnce(definitions.map((d) => d.id))
    })

    it('should slice to the limit and return a next cursor preserving the filters with emoteId param', async () => {
      const response = await emotesCatalogHandler(
        buildContext(
          '/collections/emotes?collectionId=urn:c&emoteId=urn:1&textSearch=dance&limit=10',
          jest.fn().mockResolvedValueOnce(definitions)
        )
      )

      expect(response.body.emotes).toHaveLength(10)
      const next = response.body.pagination.next
      expect(next).toBeDefined()
      const nextParams = new URLSearchParams(next!.startsWith('?') ? next!.slice(1) : next)
      expect(nextParams.getAll('collectionId')).toEqual(['urn:c'])
      expect(nextParams.getAll('emoteId')).toEqual(['urn:1'])
      expect(nextParams.get('textSearch')).toBe('dance')
      expect(nextParams.get('limit')).toBe('10')
      expect(nextParams.get('lastId')).toBe('urn:matic:e:j')
    })
  })
})
