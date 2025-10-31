import { fetchNameOwner, NameOwnerFromQuery } from '../../../../src/logic/fetch-elements/fetch-name-owner'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'

describe('fetchNameOwner', () => {
  let theGraph: any
  let mockQuery: jest.SpyInstance

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
    mockQuery = jest.spyOn(theGraph.ensSubgraph, 'query')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the ensSubgraph is queried', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValue({ nfts: [] })
    })

    it('should call the ensSubgraph query method', async () => {
      await fetchNameOwner({ theGraph }, 'test-name')
      expect(theGraph.ensSubgraph.query).toBeCalled()
    })
  })

  describe('when the name is found', () => {
    let mockResult: NameOwnerFromQuery

    beforeEach(() => {
      mockResult = {
        nfts: [
          {
            owner: {
              address: '0x123456789abcdef'
            }
          }
        ]
      }
      mockQuery.mockResolvedValue(mockResult)
    })

    it('should return the owner address', async () => {
      const result = await fetchNameOwner({ theGraph }, 'test-name')

      expect(result).toEqual({
        owner: '0x123456789abcdef'
      })
    })
  })

  describe('when the name is not found', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValue({ nfts: [] })
    })

    it('should return null as owner', async () => {
      const result = await fetchNameOwner({ theGraph }, 'non-existent-name')

      expect(result).toEqual({
        owner: null
      })
    })
  })

  describe('when querying with parameters', () => {
    let testName: string

    beforeEach(() => {
      testName = 'test-name'
      mockQuery.mockResolvedValue({ nfts: [] })
    })

    it('should call the query with correct parameters', async () => {
      await fetchNameOwner({ theGraph }, testName)

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query fetchNameOwner($name: String)'), {
        name: testName
      })
    })
  })
})
