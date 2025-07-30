import { fetchAllPermissions, OperatorFromQuery } from '../../../../src/logic/fetch-elements/fetch-permissions'
import { THE_GRAPH_PAGE_SIZE } from '../../../../src/logic/fetch-elements/fetch-elements'
import { generateOperators } from '../../../data/operators'

describe('fetch-user-permissions', () => {
  const mockTheGraph = {
    landSubgraph: {
      query: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when no permissions are found', () => {
    beforeEach(() => {
      mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: [] })
    })

    it('should return empty array', async () => {
      const result = await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

      expect(result).toEqual([])
    })

    it('should query the graph with expected parameters', async () => {
      await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

      expect(mockTheGraph.landSubgraph.query).toHaveBeenCalledWith(
        expect.stringContaining('query fetchParcelsByUpdateOperator'),
        {
          updateOperator: '0x123',
          first: THE_GRAPH_PAGE_SIZE,
          skip: 0
        }
      )
    })
  })

  describe('when there are permissions to fetch', () => {
    let permissions: OperatorFromQuery[]

    describe('and there is a single permission', () => {
      beforeEach(() => {
        permissions = generateOperators(1)
        mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: permissions })
      })

      it('should return the single operator', async () => {
        const result = await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

        expect(result).toEqual([
          {
            id: 'id-0',
            x: '0',
            y: '0',
            owner: 'owner-0',
            updateOperator: 'updateOperator-0'
          }
        ])
      })

      it('should transform operator data correctly', async () => {
        const result = await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

        expect(result[0]).toEqual({
          id: 'id-0',
          x: '0',
          y: '0',
          owner: 'owner-0',
          updateOperator: 'updateOperator-0'
        })
      })
    })

    describe('and there are multiple permissions', () => {
      beforeEach(() => {
        permissions = generateOperators(2)
        mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: permissions })
      })

      it('should return all operators available since they fit in a single page', async () => {
        const result = await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

        expect(result).toEqual([
          {
            id: 'id-0',
            x: '0',
            y: '0',
            owner: 'owner-0',
            updateOperator: 'updateOperator-0'
          },
          {
            id: 'id-1',
            x: '1',
            y: '2',
            owner: 'owner-1',
            updateOperator: 'updateOperator-1'
          }
        ])
      })

      describe('and pagination is needed', () => {
        describe('and multiple pages are required', () => {
          let firstPage: OperatorFromQuery[]
          let secondPage: OperatorFromQuery[]

          beforeEach(() => {
            jest.resetAllMocks()

            firstPage = generateOperators(THE_GRAPH_PAGE_SIZE) // Full page to trigger pagination
            secondPage = generateOperators(1)

            mockTheGraph.landSubgraph.query
              .mockResolvedValueOnce({ parcels: firstPage })
              .mockResolvedValueOnce({ parcels: secondPage })
          })

          it('should call the graph twice using the skip parameter on second call', async () => {
            const result = await fetchAllPermissions({ theGraph: mockTheGraph } as any, '0x123')

            expect(result).toHaveLength(THE_GRAPH_PAGE_SIZE + 1) // 1000 + 1
            expect(mockTheGraph.landSubgraph.query).toHaveBeenCalledTimes(2)

            // First call
            expect(mockTheGraph.landSubgraph.query).toHaveBeenNthCalledWith(
              1,
              expect.stringContaining('query fetchParcelsByUpdateOperator'),
              {
                updateOperator: '0x123',
                first: THE_GRAPH_PAGE_SIZE,
                skip: 0
              }
            )

            // Second call
            expect(mockTheGraph.landSubgraph.query).toHaveBeenNthCalledWith(
              2,
              expect.stringContaining('query fetchParcelsByUpdateOperator'),
              {
                updateOperator: '0x123',
                first: THE_GRAPH_PAGE_SIZE,
                skip: THE_GRAPH_PAGE_SIZE
              }
            )
          })
        })
      })
    })
  })
})
