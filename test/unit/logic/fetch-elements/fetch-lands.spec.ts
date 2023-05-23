import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'
import { LAND } from '../../../../src/types'
import { fetchAllLANDs, LANDFromQuery } from '../../../../src/logic/fetch-elements/fetch-lands'

it('the ensSubgraph is queried', async () => {
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.ensSubgraph, 'query').mockResolvedValue({ nfts: [] })
  await fetchAllLANDs({ theGraph }, 'anOwner')
  expect(theGraph.ensSubgraph.query).toBeCalled()
})

it('lands are mapped correctly', async () => {
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.ensSubgraph, 'query').mockResolvedValue({
    nfts: [
      {
        id: 'id1',
        contractAddress: 'address1',
        tokenId: 'tokenId1',
        category: 'parcel',
        name: 'name1',
        parcel: {
          x: '0',
          y: '1',
          data: {
            description: 'i am a parcel'
          }
        },
        image: 'img1'
      },
      {
        id: 'id2',
        contractAddress: 'address2',
        tokenId: 'tokenId2',
        category: 'estate',
        name: null,
        estate: {
          data: {
            description: 'i am an estate'
          }
        },
        activeOrder: {
          price: 100
        }
      }
    ] as LANDFromQuery[]
  })
  const lands = await fetchAllLANDs({ theGraph }, 'anOwner')
  expect(lands).toEqual([
    {
      contractAddress: 'address1',
      tokenId: 'tokenId1',
      category: 'parcel',
      name: 'name1',
      x: '0',
      y: '1',
      description: 'i am a parcel',
      image: 'img1'
    },
    {
      contractAddress: 'address2',
      tokenId: 'tokenId2',
      category: 'estate',
      name: undefined,
      description: 'i am an estate',
      price: 100
    }
  ] as LAND[])
})
