import { buildNextQuery, paginateCatalogResults, parseCatalogQuery } from '../../../src/logic/items-catalog'
import { InvalidRequestError } from '../../../src/types'

describe('parseCatalogQuery', () => {
  describe('when no filter is provided', () => {
    let searchParams: URLSearchParams

    beforeEach(() => {
      searchParams = new URL('http://localhost/').searchParams
    })

    it('should reject with InvalidRequestError', () => {
      expect(() => parseCatalogQuery(searchParams, 'wearableId')).toThrow(InvalidRequestError)
    })

    it('should mention the wearableId param name in the wearables variant', () => {
      expect(() => parseCatalogQuery(searchParams, 'wearableId')).toThrow(/wearableId/)
    })

    it('should mention the emoteId param name in the emotes variant', () => {
      expect(() => parseCatalogQuery(searchParams, 'emoteId')).toThrow(/emoteId/)
    })
  })

  describe('when textSearch is shorter than 3 characters', () => {
    let searchParams: URLSearchParams

    beforeEach(() => {
      searchParams = new URL('http://localhost/?textSearch=ab').searchParams
    })

    it('should reject with InvalidRequestError', () => {
      expect(() => parseCatalogQuery(searchParams, 'wearableId')).toThrow(InvalidRequestError)
    })
  })

  describe('when too many ids are passed', () => {
    describe('and the variant is wearableId', () => {
      let searchParams: URLSearchParams

      beforeEach(() => {
        const ids = Array.from({ length: 501 }, (_, i) => `wearableId=urn${i}`).join('&')
        searchParams = new URL(`http://localhost/?${ids}`).searchParams
      })

      it('should reject with the wearables label in the error message', () => {
        expect(() => parseCatalogQuery(searchParams, 'wearableId')).toThrow(/wearables/)
      })
    })

    describe('and the variant is emoteId', () => {
      let searchParams: URLSearchParams

      beforeEach(() => {
        const ids = Array.from({ length: 501 }, (_, i) => `emoteId=urn${i}`).join('&')
        searchParams = new URL(`http://localhost/?${ids}`).searchParams
      })

      it('should reject with the emotes label in the error message', () => {
        expect(() => parseCatalogQuery(searchParams, 'emoteId')).toThrow(/emotes/)
      })
    })
  })

  describe('when given valid input', () => {
    describe('and the limit is out of range', () => {
      let searchParams: URLSearchParams

      beforeEach(() => {
        searchParams = new URL(
          'http://localhost/?collectionId=URN:A&wearableId=URN:1&textSearch=Hat&limit=99999'
        ).searchParams
      })

      it('should lowercase collectionIds, itemIds, and textSearch', () => {
        const result = parseCatalogQuery(searchParams, 'wearableId')

        expect(result.filters).toEqual({ collectionIds: ['urn:a'], itemIds: ['urn:1'], textSearch: 'hat' })
      })

      it('should clamp the limit to the 500 maximum', () => {
        const result = parseCatalogQuery(searchParams, 'wearableId')

        expect(result.limit).toBe(500)
      })

      it('should leave lastId undefined when not provided', () => {
        const result = parseCatalogQuery(searchParams, 'wearableId')

        expect(result.lastId).toBeUndefined()
      })
    })

    describe('and the limit and cursor are within range', () => {
      let searchParams: URLSearchParams

      beforeEach(() => {
        searchParams = new URL('http://localhost/?textSearch=hat&limit=42&lastId=URN:Cursor').searchParams
      })

      it('should accept the requested limit verbatim', () => {
        const result = parseCatalogQuery(searchParams, 'wearableId')

        expect(result.limit).toBe(42)
      })

      it('should lowercase the cursor', () => {
        const result = parseCatalogQuery(searchParams, 'wearableId')

        expect(result.lastId).toBe('urn:cursor')
      })
    })
  })
})

describe('paginateCatalogResults', () => {
  describe('when the merged set fits within the limit', () => {
    let preMerge: { id: string }[]
    let fetched: { id: string }[]

    beforeEach(() => {
      preMerge = [{ id: 'a' }, { id: 'b' }]
      fetched = [{ id: 'c' }]
    })

    it('should return every item and no nextLastId', () => {
      const result = paginateCatalogResults(preMerge, fetched, 10)

      expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
      expect(result.nextLastId).toBeUndefined()
    })
  })

  describe('when the merged set exceeds the limit', () => {
    let preMerge: { id: string }[]
    let fetched: { id: string }[]

    beforeEach(() => {
      preMerge = [{ id: 'a' }]
      fetched = [{ id: 'b' }, { id: 'c' }, { id: 'd' }]
    })

    it('should slice to the limit and emit nextLastId pointing to the last sliced item', () => {
      const result = paginateCatalogResults(preMerge, fetched, 2)

      expect(result.items.map((i) => i.id)).toEqual(['a', 'b'])
      expect(result.nextLastId).toBe('b')
    })
  })

  describe('when the on-chain definitions arrive out of order', () => {
    let fetched: { id: string }[]

    beforeEach(() => {
      fetched = [{ id: 'c' }, { id: 'a' }, { id: 'b' }]
    })

    it('should re-sort defensively before merging', () => {
      const result = paginateCatalogResults<{ id: string }>([], fetched, 10)

      expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('when some definitions are undefined (cache miss)', () => {
    let fetched: ({ id: string } | undefined)[]

    beforeEach(() => {
      fetched = [{ id: 'a' }, undefined, { id: 'b' }]
    })

    it('should drop the undefined entries silently', () => {
      const result = paginateCatalogResults<{ id: string }>([], fetched, 10)

      expect(result.items.map((i) => i.id)).toEqual(['a', 'b'])
    })
  })
})

describe('buildNextQuery', () => {
  describe('when called for the wearables catalog', () => {
    let query: string

    beforeEach(() => {
      query = buildNextQuery(
        { collectionIds: ['urn:c1', 'urn:c2'], itemIds: ['urn:1'], textSearch: 'hat' },
        10,
        'urn:cursor',
        'wearableId'
      )
    })

    it('should serialize every collectionId as a repeated collectionId param', () => {
      const params = new URLSearchParams(query)
      expect(params.getAll('collectionId')).toEqual(['urn:c1', 'urn:c2'])
    })

    it('should serialize itemIds under the wearableId param name', () => {
      const params = new URLSearchParams(query)
      expect(params.getAll('wearableId')).toEqual(['urn:1'])
    })

    it('should preserve textSearch, limit, and lastId', () => {
      const params = new URLSearchParams(query)
      expect(params.get('textSearch')).toBe('hat')
      expect(params.get('limit')).toBe('10')
      expect(params.get('lastId')).toBe('urn:cursor')
    })
  })

  describe('when called for the emotes catalog', () => {
    let query: string

    beforeEach(() => {
      query = buildNextQuery({ itemIds: ['urn:e:1', 'urn:e:2'] }, 5, 'urn:e:c', 'emoteId')
    })

    it('should serialize itemIds under the emoteId param name', () => {
      const params = new URLSearchParams(query)
      expect(params.getAll('emoteId')).toEqual(['urn:e:1', 'urn:e:2'])
    })

    it('should not emit any wearableId entries', () => {
      const params = new URLSearchParams(query)
      expect(params.has('wearableId')).toBe(false)
    })
  })
})
