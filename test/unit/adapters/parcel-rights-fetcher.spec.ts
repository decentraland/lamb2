import { createLogComponent } from '@well-known-components/logger'
import { createParcelRightsComponent } from '../../../src/adapters/parcel-rights-fetcher'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { TheGraphComponent } from '../../../src/ports/the-graph'
import { createParcelPermissionsComponent } from '../../../src/adapters/parcel-permissions-fetcher'

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

describe('ParcelRightsComponent', () => {
  describe('getOperatorsOfParcel', () => {
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

      const component = await createParcelRightsComponent({ theGraph, logs })
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

      const component = await createParcelRightsComponent({ theGraph, logs })
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

      const component = await createParcelRightsComponent({ theGraph, logs })
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

      const component = await createParcelRightsComponent({ theGraph, logs })
      const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

      expect(operators).toEqual({
        owner: ownerAddress.toLowerCase()
      })
    })

    it('uses first estate when multiple estates exist', async () => {
      const logs = await createLogComponent({})
      const ownerAddress = '0xowner1'
      const operatorAddress = '0xoperator1'
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
          },
          {
            owner: {
              address: '0xowner2'
            },
            updateOperator: '0xoperator2'
          }
        ]
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelRightsComponent({ theGraph, logs })
      const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

      expect(operators).toEqual({
        owner: ownerAddress.toLowerCase(),
        operator: operatorAddress.toLowerCase()
      })
    })

    it('uses first parcel when multiple parcels exist', async () => {
      const logs = await createLogComponent({})
      const ownerAddress = '0xowner1'
      const operatorAddress = '0xoperator1'
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
          },
          {
            x: parcelX.toString(),
            y: parcelY.toString(),
            owner: {
              address: '0xowner2'
            },
            updateOperator: '0xoperator2'
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelRightsComponent({ theGraph, logs })
      const operators = await component.getOperatorsOfParcel(parcelX, parcelY)

      expect(operators).toEqual({
        owner: ownerAddress,
        operator: operatorAddress
      })
    })

    it('throws error when no parcel or estate is found', async () => {
      const logs = await createLogComponent({})
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelRightsComponent({ theGraph, logs })
      await expect(component.getOperatorsOfParcel(parcelX, parcelY)).rejects.toThrow()
    })

    it('throws error when owner is null in parcels', async () => {
      const logs = await createLogComponent({})
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [
          {
            x: parcelX.toString(),
            y: parcelY.toString(),
            owner: null,
            updateOperator: '0xoperator'
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelRightsComponent({ theGraph, logs })
      await expect(component.getOperatorsOfParcel(parcelX, parcelY)).rejects.toThrow()
    })
  })

  describe('ParcelPermissionsComponent', () => {
    it('resolves to the owner permission being true when user is parcel owner', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [
          {
            x: parcelX.toString(),
            y: parcelY.toString(),
            owner: {
              address: userAddress
            },
            updateOperator: '0xsomeoneelse'
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: true, operator: false })
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
        addressLower: userAddress,
        x: parcelX,
        y: parcelY
      })
    })

    it('resolves to the operator permission being true when user is parcel owner', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
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
            updateOperator: userAddress
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: true })
    })

    it('returns correct permissions when user is estate owner', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [],
        estates: [
          {
            owner: {
              address: userAddress
            },
            updateOperator: '0xsomeoneelse'
          }
        ]
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: true, operator: false })
    })

    it('returns correct permissions when user is estate operator', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
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
            updateOperator: userAddress
          }
        ]
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: true })
    })

    it('returns negative permissions when there are no matches', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: false })
    })

    it('handles null updateOperator in parcels correctly', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
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
      })

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: false })
    })

    it('handles undefined updateOperator in estates correctly', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
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
      })

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: false })
    })

    it('logs information about the permissions query', async () => {
      const logs = await createLogComponent({})
      const mockLogger = {
        info: jest.fn()
      }
      logs.getLogger = jest.fn().mockReturnValue(mockLogger)

      const userAddress = '0xuser'
      const parcelX = 10
      const parcelY = 20

      const mockResult = {
        parcels: [],
        estates: []
      } as unknown

      const mockQuery = jest.fn().mockResolvedValue(mockResult)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(logs.getLogger).toHaveBeenCalledWith('parcel-permissions-component')
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Parcel permissions for address ${userAddress} at x=${parcelX} y=${parcelY}: ${JSON.stringify(mockResult)}`
      )
    })

    it('returns no permissions when user has no access', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
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
            updateOperator: '0xsomeoneelse'
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: false, operator: false })
    })

    it('returns both permissions when user is both owner and operator', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [
          {
            x: parcelX.toString(),
            y: parcelY.toString(),
            owner: {
              address: userAddress
            },
            updateOperator: userAddress
          }
        ],
        estates: []
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: true, operator: true })
    })

    it('uses first estate when multiple estates exist', async () => {
      const logs = await createLogComponent({})
      const userAddress = '0xuser'
      const ownerAddress = '0xowner'
      const parcelX = 10
      const parcelY = 20

      const mockQuery = jest.fn().mockResolvedValue({
        parcels: [],
        estates: [
          {
            owner: {
              address: userAddress
            },
            updateOperator: '0xsomeoneelse'
          },
          {
            owner: {
              address: ownerAddress
            },
            updateOperator: userAddress
          }
        ]
      } as unknown)

      const theGraph = createMockTheGraphComponent(mockQuery)

      const component = await createParcelPermissionsComponent({ theGraph, logs })
      const permissions = await component.getParcelPermissions(userAddress, parcelX, parcelY)

      expect(permissions).toEqual({ owner: true, operator: false })
    })
  })
})
