import { buildNextQuery, paginateCatalogResults, parseCatalogQuery } from '../../../src/logic/items-catalog'
import { InvalidRequestError } from '../../../src/types'

describe('parseCatalogQuery', () => {
  describe('when no filter is provided', () => {
    it('should throw InvalidRequestError mentioning the configured id param name', () => {
      const params = new URL('http://localhost/').searchParams
      expect(() => parseCatalogQuery(params, 'wearableId')).toThrow(InvalidRequestError)
      expect(() => parseCatalogQuery(params, 'wearableId')).toThrow(/wearableId/)
      expect(() => parseCatalogQuery(params, 'emoteId')).toThrow(/emoteId/)
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    it('should throw InvalidRequestError', () => {
      const params = new URL('http://localhost/?textSearch=ab').searchParams
      expect(() => parseCatalogQuery(params, 'wearableId')).toThrow(InvalidRequestError)
    })
  })

  describe('when too many ids are passed', () => {
    it('should throw with the wearables label for wearableId', () => {
      const ids = Array.from({ length: 501 }, (_, i) => `wearableId=urn${i}`).join('&')
      const params = new URL(`http://localhost/?${ids}`).searchParams
      expect(() => parseCatalogQuery(params, 'wearableId')).toThrow(/wearables/)
    })

    it('should throw with the emotes label for emoteId', () => {
      const ids = Array.from({ length: 501 }, (_, i) => `emoteId=urn${i}`).join('&')
      const params = new URL(`http://localhost/?${ids}`).searchParams
      expect(() => parseCatalogQuery(params, 'emoteId')).toThrow(/emotes/)
    })
  })

  describe('when given valid input', () => {
    it('should lowercase ids and textSearch and clamp limit', () => {
      const params = new URL(
        'http://localhost/?collectionId=URN:A&wearableId=URN:1&textSearch=Hat&limit=99999'
      ).searchParams

      const result = parseCatalogQuery(params, 'wearableId')

      expect(result.filters).toEqual({ collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'hat' })
      expect(result.limit).toBe(500)
      expect(result.lastId).toBeUndefined()
    })

    it('should accept a valid limit and lowercase the cursor', () => {
      const params = new URL('http://localhost/?textSearch=hat&limit=42&lastId=URN:Cursor').searchParams

      const result = parseCatalogQuery(params, 'wearableId')

      expect(result.limit).toBe(42)
      expect(result.lastId).toBe('urn:cursor')
    })
  })
})

describe('paginateCatalogResults', () => {
  describe('when the merged set fits within the limit', () => {
    it('should return all items and no nextLastId', () => {
      const result = paginateCatalogResults([{ id: 'a' }, { id: 'b' }], [{ id: 'c' }], 10)
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
      expect(result.nextLastId).toBeUndefined()
    })
  })

  describe('when the merged set exceeds the limit', () => {
    it('should slice and emit nextLastId from the last sliced item', () => {
      const result = paginateCatalogResults(
        [{ id: 'a' }],
        [{ id: 'b' }, { id: 'c' }, { id: 'd' }],
        2
      )
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b'])
      expect(result.nextLastId).toBe('b')
    })
  })

  describe('when the on-chain definitions arrive out of order', () => {
    it('should re-sort defensively before merging', () => {
      const result = paginateCatalogResults<{ id: string }>([], [{ id: 'c' }, { id: 'a' }, { id: 'b' }], 10)
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('when some definitions are undefined (cache miss)', () => {
    it('should drop them silently', () => {
      const result = paginateCatalogResults<{ id: string }>([], [{ id: 'a' }, undefined, { id: 'b' }], 10)
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b'])
    })
  })
})

describe('buildNextQuery', () => {
  describe('when called for the wearables catalog', () => {
    it('should serialize collectionIds, itemIds (as wearableId), textSearch, limit, and lastId', () => {
      const query = buildNextQuery(
        { collectionIds: ['urn:c1', 'urn:c2'], itemIds: ['urn:1'], textSearch: 'hat' },
        10,
        'urn:cursor',
        'wearableId'
      )

      const params = new URLSearchParams(query)
      expect(params.getAll('collectionId')).toEqual(['urn:c1', 'urn:c2'])
      expect(params.getAll('wearableId')).toEqual(['urn:1'])
      expect(params.get('textSearch')).toBe('hat')
      expect(params.get('limit')).toBe('10')
      expect(params.get('lastId')).toBe('urn:cursor')
    })
  })

  describe('when called for the emotes catalog', () => {
    it('should serialize itemIds as emoteId', () => {
      const query = buildNextQuery({ itemIds: ['urn:e:1', 'urn:e:2'] }, 5, 'urn:e:c', 'emoteId')

      const params = new URLSearchParams(query)
      expect(params.getAll('emoteId')).toEqual(['urn:e:1', 'urn:e:2'])
      expect(params.has('wearableId')).toBe(false)
    })
  })
})
