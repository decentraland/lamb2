import { EmoteDefinition } from '@dcl/schemas'
import { emotesCatalogHandler } from '../../src/controllers/handlers/emotes-catalog-handler'
import * as itemsByFiltersModule from '../../src/logic/fetch-elements/fetch-items-by-filters'
import { InvalidRequestError } from '../../src/types'

describe('emotes-catalog-handler: GET /collections/emotes', () => {
  let fetchEmotesSpy: jest.SpyInstance

  function buildContext(urlPath: string, fetchItemsDefinitions: jest.Mock = jest.fn().mockResolvedValue([])) {
    return {
      components: {
        theGraph: {} as any,
        emoteDefinitionsFetcher: { fetchItemsDefinitions } as any
      },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  beforeEach(() => {
    fetchEmotesSpy = jest.spyOn(itemsByFiltersModule, 'fetchEmotesByFilters')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no filter is provided', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext('/collections/emotes')
    })

    it('should reject with InvalidRequestError without invoking the fetcher', async () => {
      await expect(emotesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(fetchEmotesSpy).not.toHaveBeenCalled()
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext('/collections/emotes?textSearch=ab')
    })

    it("should reject with a 'must be at least 3 characters' InvalidRequestError", async () => {
      await expect(emotesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 emoteIds are passed', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const ids = Array.from({ length: 501 }, (_, i) => `emoteId=urn${i}`).join('&')
      context = buildContext(`/collections/emotes?${ids}`)
    })

    it('should reject with InvalidRequestError', async () => {
      await expect(emotesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when more than 500 collectionIds are passed', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const ids = Array.from({ length: 501 }, (_, i) => `collectionId=urn${i}`).join('&')
      context = buildContext(`/collections/emotes?${ids}`)
    })

    it('should reject with InvalidRequestError', async () => {
      await expect(emotesCatalogHandler(context)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('when called with valid filters', () => {
    let definitionA: EmoteDefinition
    let definitionB: EmoteDefinition
    let fetchItemsDefinitions: jest.Mock
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      definitionA = { id: 'urn:matic:e:a' } as EmoteDefinition
      definitionB = { id: 'urn:matic:e:b' } as EmoteDefinition
      fetchEmotesSpy.mockResolvedValueOnce(['urn:matic:e:a', 'urn:matic:e:b'])
      fetchItemsDefinitions = jest.fn().mockResolvedValueOnce([definitionA, definitionB])
      context = buildContext(
        '/collections/emotes?collectionId=URN:A&emoteId=URN:1&textSearch=Dance',
        fetchItemsDefinitions
      )
    })

    it('should pass lowercased filters and request limit+1 to detect more pages', async () => {
      await emotesCatalogHandler(context)

      expect(fetchEmotesSpy).toHaveBeenCalledWith(
        expect.anything(),
        { collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'dance' },
        expect.objectContaining({ limit: 501, lastId: undefined })
      )
    })

    it('should resolve definitions for the returned urns and respond with the catalog body', async () => {
      const response = await emotesCatalogHandler(context)

      expect(fetchItemsDefinitions).toHaveBeenCalledWith(['urn:matic:e:a', 'urn:matic:e:b'])
      expect(response.body.emotes).toEqual([definitionA, definitionB])
      expect(response.body.pagination).toEqual({ limit: 500, lastId: undefined, next: undefined })
    })
  })

  describe('when the fetcher returns more results than the requested limit', () => {
    let definitions: EmoteDefinition[]
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
      definitions = letters.map((l) => ({ id: `urn:matic:e:${l}` })) as EmoteDefinition[]
      fetchEmotesSpy.mockResolvedValueOnce(definitions.map((d) => d.id))
      context = buildContext(
        '/collections/emotes?collectionId=urn:c&emoteId=urn:1&textSearch=dance&limit=10',
        jest.fn().mockResolvedValueOnce(definitions)
      )
    })

    it('should slice to the requested limit and emit a next cursor preserving the filters with emoteId param', async () => {
      const response = await emotesCatalogHandler(context)

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
