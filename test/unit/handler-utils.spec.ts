import { createPaginationAndFilters } from '../../src/controllers/handlers/utils'
import { InvalidRequestError } from '../../src/types'

describe('when building the pagination and filters of an items request', () => {
  let url: URL

  describe('and a category the item type defines is requested', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?category=hat')
    })

    it('should keep the category in the filters', () => {
      expect(createPaginationAndFilters(url, 1000, 'wearable').filters.category).toBe('hat')
    })
  })

  describe('and a category only wearables define is requested from emotes', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/emotes?category=hat')
    })

    it('should reject the request rather than let it reach a backend', () => {
      expect(() => createPaginationAndFilters(url, 1000, 'emote')).toThrow(InvalidRequestError)
    })
  })

  describe('and a category no item type defines is requested', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?category=not_a_category')
    })

    it('should reject the request rather than let it reach a backend', () => {
      expect(() => createPaginationAndFilters(url, 1000, 'wearable')).toThrow(InvalidRequestError)
    })
  })

  describe('and no item type is given', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?category=not_a_category')
    })

    it('should leave the category unvalidated for callers that filter in memory', () => {
      expect(createPaginationAndFilters(url, 1000).filters.category).toBe('not_a_category')
    })
  })
})
