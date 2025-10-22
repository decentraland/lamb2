import { fetchNames, NameFromQuery } from '../../../../src/logic/fetch-elements/fetch-names'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'
import { Name } from '../../../../src/types'

const mockLogs = {
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  })
}

it('the ensSubgraph is queried', async () => {
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.ensSubgraph, 'query').mockResolvedValue({ nfts: [] })
  await fetchNames({ theGraph, logs: mockLogs }, 'anOwner')
  expect(theGraph.ensSubgraph.query).toBeCalled()
})

it('names are mapped correctly', async () => {
  const theGraph = createTheGraphComponentMock()
  const nftsNames: NameFromQuery[] = [
    {
      id: 'id1',
      name: 'name1',
      contractAddress: 'address1',
      tokenId: 'tokenId1',
      activeOrder: {
        price: 100
      }
    },
    {
      id: 'id2',
      name: 'name2',
      contractAddress: 'address2',
      tokenId: 'tokenId2'
    }
  ]
  jest.spyOn(theGraph.ensSubgraph, 'query').mockResolvedValue({
    nfts: nftsNames
  })
  const names = await fetchNames({ theGraph, logs: mockLogs }, 'anOwner')
  expect(names).toEqual({
    elements: [
      {
        name: 'name1',
        contractAddress: 'address1',
        tokenId: 'tokenId1',
        price: 100
      },
      {
        name: 'name2',
        contractAddress: 'address2',
        tokenId: 'tokenId2'
      }
    ],
    totalAmount: 2
  })
})
