import { fetchAllNames, NameFromQuery } from '../../../../src/logic/fetch-elements/fetch-names'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'
import { Name } from '../../../../src/types'

it('the ensSubgraph is queried', async () => {
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.ensSubgraph, 'query').mockResolvedValue({ nfts: [] })
  await fetchAllNames({ theGraph }, 'anOwner')
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
  const names = await fetchAllNames({ theGraph }, 'anOwner')
  expect(names).toEqual([
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
  ] as Name[])
})
