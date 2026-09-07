import { createPaginationAndFilters } from '../../src/controllers/handlers/utils'

describe('when extracting the filters of an items request', () => {
  let url: URL

  describe('and the category is not lowercase', () => {
    beforeEach(() => {
      url = new URL('http://localhost/users/0x1/wearables?category=HAT')
    })

    it('should normalise it so the cache, the marketplace API and the subgraph see the same value', () => {
      expect(createPaginationAndFilters(url, 1000).filters.category).toBe('hat')
    })
  })
})
