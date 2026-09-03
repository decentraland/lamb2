import { Network } from '@dcl/schemas'
import { ISubgraphComponent } from '@dcl/thegraph-component'
import { ElementsFilters } from '../../../../src/adapters/elements-fetcher'
import { createItemQueryBuilder, fetchOwnedNFTs } from '../../../../src/logic/fetch-elements/graph-pagination'
import { InvalidRequestError } from '../../../../src/types'

describe('when building the owned items query', () => {
  let filters: ElementsFilters | undefined
  let query: string | null

  describe('and no filters are requested', () => {
    beforeEach(() => {
      filters = undefined
      query = createItemQueryBuilder('wearable', Network.MATIC)(filters)
    })

    it('should bind the id cursor, which the subgraph rejects when left unbound', () => {
      expect(query).toContain('where: { id_gt: $idFrom,')
    })

    it('should order by id ascending, the only order the id cursor can walk', () => {
      expect(query).toContain('orderBy: id,\n        orderDirection: asc')
    })
  })

  describe('and the results are ordered by date', () => {
    beforeEach(() => {
      filters = { orderBy: 'date', direction: 'DESC' }
      query = createItemQueryBuilder('wearable', Network.MATIC)(filters)
    })

    it('should keep ordering by id, leaving the requested order to the in-memory layer', () => {
      expect(query).toContain('orderBy: id,\n        orderDirection: asc')
    })

    it('should not emit an uppercase direction, which is not a valid enum value', () => {
      expect(query).not.toContain('DESC')
    })
  })

  describe('and the results are ordered by name', () => {
    beforeEach(() => {
      filters = { orderBy: 'name' }
      query = createItemQueryBuilder('wearable', Network.MATIC)(filters)
    })

    it('should not emit metadata__name, which is not in the orderBy enum', () => {
      expect(query).not.toContain('metadata__name')
    })
  })

  describe('and the results are filtered by a wearable category', () => {
    beforeEach(() => {
      filters = { category: 'hat' }
      query = createItemQueryBuilder('wearable', Network.MATIC)(filters)
    })

    it('should filter on searchWearableCategory rather than the entity kind', () => {
      expect(query).toContain('searchWearableCategory: hat')
    })
  })

  describe('and the results are filtered by an emote category', () => {
    beforeEach(() => {
      filters = { category: 'dance' }
      query = createItemQueryBuilder('emote')(filters)
    })

    it('should filter on searchEmoteCategory', () => {
      expect(query).toContain('searchEmoteCategory: dance')
    })
  })

  describe('and the results are filtered by body_shape, which no collection NFT carries', () => {
    beforeEach(() => {
      filters = { category: 'body_shape' }
      query = createItemQueryBuilder('wearable', Network.MATIC)(filters)
    })

    it('should resolve to no query so the caller can skip the subgraph', () => {
      expect(query).toBeNull()
    })
  })

  describe('and the results are filtered by a category the subgraph cannot express', () => {
    beforeEach(() => {
      filters = { category: 'not_a_category' }
    })

    it('should throw an invalid request error instead of interpolating it into the query', () => {
      expect(() => createItemQueryBuilder('wearable', Network.MATIC)(filters)).toThrow(InvalidRequestError)
    })
  })
})

describe('when walking the NFTs owned by an address', () => {
  let subgraph: ISubgraphComponent
  let owner: string
  let query: string

  beforeEach(() => {
    owner = '0xAbCdEf0000000000000000000000000000000001'
    query = createItemQueryBuilder('wearable', Network.MATIC)(undefined)!
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the owner holds fewer NFTs than one page', () => {
    beforeEach(async () => {
      subgraph = { query: jest.fn().mockResolvedValue({ nfts: [{ id: 'a' }] }) }
      await fetchOwnedNFTs(subgraph, query, owner)
    })

    it('should bind the cursor to an empty string on the only request', () => {
      expect(subgraph.query).toHaveBeenCalledWith(query, { owner: owner.toLowerCase(), idFrom: '' })
    })
  })

  describe('and the owner holds more NFTs than one page', () => {
    let firstPage: { id: string }[]

    beforeEach(async () => {
      firstPage = Array.from({ length: 1000 }, (_, index) => ({ id: `id-${index}` }))
      subgraph = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ nfts: firstPage })
          .mockResolvedValueOnce({ nfts: [{ id: 'id-last' }] })
      }
      await fetchOwnedNFTs(subgraph, query, owner)
    })

    it('should advance the cursor to the last id of the previous page', () => {
      expect(subgraph.query).toHaveBeenLastCalledWith(query, { owner: owner.toLowerCase(), idFrom: 'id-999' })
    })

    it('should always bind the cursor, never leaving it undefined', () => {
      expect((subgraph.query as jest.Mock).mock.calls.every(([, variables]) => variables.idFrom !== undefined)).toBe(
        true
      )
    })
  })
})
