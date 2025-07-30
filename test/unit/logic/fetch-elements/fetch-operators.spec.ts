import { fetchAllOperators, OperatorFromQuery } from '../../../../src/logic/fetch-elements/fetch-operators'
import { THE_GRAPH_PAGE_SIZE } from '../../../../src/logic/fetch-elements/fetch-elements'

describe('fetch-operators', () => {
  const mockTheGraph = {
    landSubgraph: {
      query: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when no operators are found', () => {
    beforeEach(() => {
      mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: [] })
    })

    it('should return empty array', async () => {
      const result = await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

      expect(result).toEqual([])
    })

    it('should query the graph with expected parameters', async () => {
      await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

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

  describe('when there are operators to fetch', () => {
    let operators: OperatorFromQuery[]

    describe('and there is a single operator', () => {
      beforeEach(() => {
        operators = [
          {
            id: '1',
            x: '10',
            y: '20',
            owner: { id: '0xowner1' },
            updateOperator: '0x123'
          }
        ]
        mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: operators })
      })

      it('should return the single operator', async () => {
        const result = await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

        expect(result).toEqual([
          {
            id: '1',
            x: '10',
            y: '20',
            owner: '0xowner1',
            updateOperator: '0x123'
          }
        ])
      })

      it('should transform operator data correctly', async () => {
        const result = await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

        expect(result[0]).toEqual({
          id: '1',
          x: '10',
          y: '20',
          owner: '0xowner1',
          updateOperator: '0x123'
        })
      })
    })

    describe('and there are multiple operators', () => {
      beforeEach(() => {
        operators = [
          {
            id: '1',
            x: '10',
            y: '20',
            owner: { id: '0xowner1' },
            updateOperator: '0x123'
          },
          {
            id: '2',
            x: '30',
            y: '40',
            owner: { id: '0xowner2' },
            updateOperator: '0x123'
          }
        ]
        mockTheGraph.landSubgraph.query.mockResolvedValueOnce({ parcels: operators })
      })

      it('should return all operators available since they fit in a single page', async () => {
        const result = await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

        expect(result).toEqual([
          {
            id: '1',
            x: '10',
            y: '20',
            owner: '0xowner1',
            updateOperator: '0x123'
          },
          {
            id: '2',
            x: '30',
            y: '40',
            owner: '0xowner2',
            updateOperator: '0x123'
          }
        ])
      })

      describe('and pagination is needed', () => {
        describe('and multiple pages are required', () => {
          let firstPage: OperatorFromQuery[]
          let secondPage: OperatorFromQuery[]

          beforeEach(() => {
            jest.resetAllMocks()

            firstPage = Array.from({ length: THE_GRAPH_PAGE_SIZE }, (_, i) => ({
              id: `id-${i}`,
              x: i.toString(),
              y: (i * 2).toString(),
              owner: { id: `owner-${i}` },
              updateOperator: '0x123'
            }))

            secondPage = [
              {
                id: `id-${THE_GRAPH_PAGE_SIZE}`,
                x: THE_GRAPH_PAGE_SIZE.toString(),
                y: (THE_GRAPH_PAGE_SIZE * 2).toString(),
                owner: { id: `owner-${THE_GRAPH_PAGE_SIZE}` },
                updateOperator: '0x123'
              }
            ]

            mockTheGraph.landSubgraph.query
              .mockResolvedValueOnce({ parcels: firstPage })
              .mockResolvedValueOnce({ parcels: secondPage })
          })

          it('should call the graph twice using the skip parameter on second call', async () => {
            const result = await fetchAllOperators({ theGraph: mockTheGraph } as any, '0x123')

            expect(result).toHaveLength(THE_GRAPH_PAGE_SIZE + 1)
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
