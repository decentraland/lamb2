import { createLogComponent } from '@well-known-components/logger'
import { createParcelOperatorsComponent } from '../../../src/adapters/parcel-operators-fetcher'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { TheGraphComponent } from '../../../src/ports/the-graph'

function createMockTheGraphComponent(mockLandQuery: jest.Mock): TheGraphComponent {
  return {
    start: async () => {},
    stop: async () => {},
    ethereumCollectionsSubgraph: {} as ISubgraphComponent,
    maticCollectionsSubgraph: {} as ISubgraphComponent,
    ensSubgraph: {} as ISubgraphComponent,
    thirdPartyRegistrySubgraph: {} as ISubgraphComponent,
    landSubgraph: {
      query: mockLandQuery
    } as ISubgraphComponent
  }
}

describe('ParcelOperatorsComponent', () => {
  it('resolves to the correct owner and operator when parcel exists', async () => {
    const logs = await createLogComponent({})
    const ownerAddress = '0xowner'
    const operatorAddress = '0xoperator'
    const parcelX = 10
    const parcelY = 20

    const mockQuery = jest.fn().mockResolvedValue({
      parcels: [
        {
          x: parcelX.toString(),
          y: parcelY.toString(),
          owner: {
            address: ownerAddress
          },
          updateOperator: operatorAddress
        }
      ],
      estates: []
    } as unknown)

    const theGraph = createMockTheGraphComponent(mockQuery)

    const component = await createParcelOperatorsComponent({ theGraph, logs })
    const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

    expect(operators).toEqual({ owner: ownerAddress, operator: operatorAddress })
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
      x: parcelX,
      y: parcelY
    })
  })

  it('resolves to the correct owner and operator when estate exists', async () => {
    const logs = await createLogComponent({})
    const ownerAddress = '0xowner'
    const operatorAddress = '0xoperator'
    const parcelX = 10
    const parcelY = 20

    const mockQuery = jest.fn().mockResolvedValue({
      parcels: [],
      estates: [
        {
          owner: {
            address: ownerAddress
          },
          updateOperator: operatorAddress
        }
      ]
    } as unknown)

    const theGraph = createMockTheGraphComponent(mockQuery)

    const component = await createParcelOperatorsComponent({ theGraph, logs })
    const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

    expect(operators).toEqual({
      owner: ownerAddress.toLowerCase(),
      operator: operatorAddress.toLowerCase()
    })
  })

  it('handles null updateOperator in parcels correctly', async () => {
    const logs = await createLogComponent({})
    const ownerAddress = '0xowner'
    const parcelX = 10
    const parcelY = 20

    const mockQuery = jest.fn().mockResolvedValue({
      parcels: [
        {
          x: parcelX.toString(),
          y: parcelY.toString(),
          owner: {
            address: ownerAddress
          },
          updateOperator: null
        }
      ],
      estates: []
    } as unknown)

    const theGraph = createMockTheGraphComponent(mockQuery)

    const component = await createParcelOperatorsComponent({ theGraph, logs })
    const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

    expect(operators).toEqual({ owner: ownerAddress })
  })

  it('handles undefined updateOperator in estates correctly', async () => {
    const logs = await createLogComponent({})
    const ownerAddress = '0xowner'
    const parcelX = 10
    const parcelY = 20

    const mockQuery = jest.fn().mockResolvedValue({
      parcels: [],
      estates: [
        {
          owner: {
            address: ownerAddress
          },
          updateOperator: undefined
        }
      ]
    } as unknown)

    const theGraph = createMockTheGraphComponent(mockQuery)

    const component = await createParcelOperatorsComponent({ theGraph, logs })
    const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

    expect(operators).toEqual({
      owner: ownerAddress.toLowerCase()
    })
  })
})
