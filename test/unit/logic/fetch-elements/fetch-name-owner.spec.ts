import { fetchNameOwner, NameOwnerFromQuery } from '../../../../src/logic/fetch-elements/fetch-name-owner'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'

const compact = (query: string) => query.replace(/\s+/g, '')

describe('fetchNameOwner', () => {
  let theGraph: any
  let mockQuery: jest.SpyInstance
  let result: { owner: string | null }

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
    mockQuery = jest.spyOn(theGraph.ensSubgraph, 'query')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the name is queried', () => {
    let sentQuery: string
    let sentVariables: Record<string, unknown>

    beforeEach(async () => {
      mockQuery.mockResolvedValueOnce({ nfts: [] })
      await fetchNameOwner({ theGraph }, 'Test-Name')
      ;[sentQuery, sentVariables] = mockQuery.mock.calls[0]
    })

    it('should filter by an exact match on the searchText of ENS NFTs', () => {
      expect(compact(sentQuery)).toContain('where:{category:ens,searchText:$name}')
    })

    it('should request a single NFT', () => {
      expect(compact(sentQuery)).toMatch(/nfts\([^)]*first:1[,)]/)
    })

    it('should not filter by name prefix or suffix', () => {
      expect(sentQuery).not.toMatch(/name_(starts|ends)_with/)
    })

    it('should send the name lowercased', () => {
      expect(sentVariables).toEqual({ name: 'test-name' })
    })
  })

  describe('when the name is found', () => {
    let mockResult: NameOwnerFromQuery

    beforeEach(async () => {
      mockResult = {
        nfts: [
          {
            owner: {
              address: '0x123456789abcdef'
            }
          }
        ]
      }
      mockQuery.mockResolvedValueOnce(mockResult)
      result = await fetchNameOwner({ theGraph }, 'test-name')
    })

    it('should return the owner address', () => {
      expect(result).toEqual({ owner: '0x123456789abcdef' })
    })
  })

  describe('when the name is not found', () => {
    beforeEach(async () => {
      mockQuery.mockResolvedValueOnce({ nfts: [] })
      result = await fetchNameOwner({ theGraph }, 'non-existent-name')
    })

    it('should return null as owner', () => {
      expect(result).toEqual({ owner: null })
    })
  })
})
