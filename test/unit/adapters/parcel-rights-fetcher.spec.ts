import { ILoggerComponent } from '@well-known-components/interfaces'
import {
  Authorization,
  AuthorizationType,
  createParcelRightsComponent,
  ParcelOperatorsFromQuery,
  ParcelRightsFetcher
} from '../../../src/adapters/parcel-rights-fetcher'
import { AppComponents, ParcelOrStateNotFoundError } from '../../../src/types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'

const LANDS_CONTRACT_ADDRESS = '0xlands'
const ESTATES_CONTRACT_ADDRESS = '0xestates'

describe('Parcel Rights Fetcher Component', () => {
  let components: Pick<AppComponents, 'theGraph' | 'logs'>
  let parcelRightsFetcher: ParcelRightsFetcher
  let mockLandSubgraphQuery: jest.Mock
  let mockLogger: ILoggerComponent

  beforeEach(async () => {
    mockLandSubgraphQuery = jest.fn()
    mockLogger = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      })
    } as any
    components = {
      theGraph: {
        landSubgraph: {
          query: mockLandSubgraphQuery
        } as ISubgraphComponent
      } as any,
      logs: mockLogger
    }
    parcelRightsFetcher = await createParcelRightsComponent(
      components,
      LANDS_CONTRACT_ADDRESS,
      ESTATES_CONTRACT_ADDRESS
    )
  })

  describe('getOperatorsOfParcel', () => {
    const X = 10
    const Y = 20
    const OWNER_ADDRESS = '0xowner'
    const OPERATOR_ADDRESS = '0xoperator'
    const UPDATE_OPERATOR_ADDRESS = '0xupdateoperator'
    const UPDATE_MANAGER_ADDRESS = '0xupdatemanager'
    const APPROVED_FOR_ALL_ADDRESS = '0xapprovedforall'

    describe('when the parcel is not part of an estate', () => {
      let parcel: ParcelOperatorsFromQuery['parcels'][0]
      let authorizations: Authorization[]

      beforeEach(() => {
        authorizations = []
        parcel = {
          x: X.toString(),
          y: Y.toString(),
          owner: { address: OWNER_ADDRESS },
          operator: null,
          updateOperator: null
        }
        mockLandSubgraphQuery.mockImplementation(async (query: string) => {
          if (query.includes('fetchOperatorsOfParcel')) {
            return {
              parcels: [parcel],
              estates: []
            }
          }
          if (query.includes('fetchAuthorizations')) {
            return { authorizations }
          }
          return {}
        })
      })

      describe('and has no operators or update operators', () => {
        it('should return the owner and empty operators and updateOperators', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: OWNER_ADDRESS,
            operator: null,
            updateOperator: null,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })

      describe('and has an operator and update operator', () => {
        beforeEach(() => {
          parcel.operator = OPERATOR_ADDRESS
          parcel.updateOperator = UPDATE_OPERATOR_ADDRESS
        })

        it('should return the owner, operator, and update operator', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: OWNER_ADDRESS,
            operator: OPERATOR_ADDRESS,
            updateOperator: UPDATE_OPERATOR_ADDRESS,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })

      describe('and has an update manager and approved for all', () => {
        beforeEach(() => {
          authorizations.push(
            {
              type: AuthorizationType.UpdateManager,
              operator: UPDATE_MANAGER_ADDRESS,
              isApproved: true,
              timestamp: 1
            },
            {
              type: AuthorizationType.Operator,
              operator: APPROVED_FOR_ALL_ADDRESS,
              isApproved: true,
              timestamp: 2
            }
          )
        })

        it('should return the owner, update manager, and approved for all', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: OWNER_ADDRESS,
            operator: null,
            updateOperator: null,
            updateManagers: [UPDATE_MANAGER_ADDRESS],
            approvedForAll: [APPROVED_FOR_ALL_ADDRESS]
          })
        })
      })

      describe('and has update managers and approved for all that have been revoked', () => {
        beforeEach(() => {
          authorizations.push(
            // The following should be ignored because the operator is not approved
            {
              type: AuthorizationType.UpdateManager,
              operator: 'anotherAddress',
              isApproved: true,
              timestamp: 3
            },
            {
              type: AuthorizationType.Operator,
              operator: 'anotherAddress',
              isApproved: true,
              timestamp: 4
            },
            {
              type: AuthorizationType.UpdateManager,
              operator: 'anotherAddress',
              isApproved: false,
              timestamp: 5
            },
            {
              type: AuthorizationType.Operator,
              operator: 'anotherAddress',
              isApproved: false,
              timestamp: 6
            }
          )
        })

        it('should return the owner and no update manager nor approved for all', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: OWNER_ADDRESS,
            operator: null,
            updateOperator: null,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })
    })

    describe('when the parcel is part of an estate', () => {
      const ESTATE_OWNER_ADDRESS = '0xestateowner'
      const ESTATE_OPERATOR_ADDRESS = '0xestateoperator'
      const ESTATE_UPDATE_OPERATOR_ADDRESS = '0xestateupdateoperator'
      let parcel: ParcelOperatorsFromQuery['parcels'][0]
      let estate: ParcelOperatorsFromQuery['estates'][0]
      let authorizations: Authorization[]

      beforeEach(() => {
        authorizations = []
        parcel = {
          x: X.toString(),
          y: Y.toString(),
          owner: { address: OWNER_ADDRESS },
          operator: null,
          updateOperator: null
        }
        estate = {
          owner: { address: ESTATE_OWNER_ADDRESS },
          operator: null,
          updateOperator: null
        }

        mockLandSubgraphQuery.mockImplementation(async (query: string) => {
          if (query.includes('fetchOperatorsOfParcel')) {
            return {
              parcels: [parcel],
              estates: [estate]
            }
          }
          if (query.includes('fetchAuthorizations')) {
            return { authorizations }
          }
          return {}
        })
      })

      describe('and has an operator in the estate', () => {
        beforeEach(() => {
          parcel.operator = null
          estate.operator = ESTATE_OPERATOR_ADDRESS
        })

        it('should return the owner from the estate and the estate operator', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: ESTATE_OWNER_ADDRESS,
            operator: ESTATE_OPERATOR_ADDRESS,
            updateOperator: null,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })

      describe('and has an update operator in the estate', () => {
        beforeEach(() => {
          parcel.updateOperator = null
          estate.updateOperator = ESTATE_UPDATE_OPERATOR_ADDRESS
        })

        it('should return the owner from the estate and the estate update operator', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: ESTATE_OWNER_ADDRESS,
            operator: null,
            updateOperator: ESTATE_UPDATE_OPERATOR_ADDRESS,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })

      describe('and has no operator in the estate', () => {
        beforeEach(() => {
          parcel.operator = null
          estate.operator = null
        })

        it('should return the owner from the estate and empty operators and updateOperators', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: ESTATE_OWNER_ADDRESS,
            operator: null,
            updateOperator: null,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })

      describe('and has no update operator in the estate', () => {
        beforeEach(() => {
          parcel.updateOperator = null
          estate.updateOperator = null
        })

        it('should return the owner from the estate and empty operators and updateOperators', async () => {
          const result = await parcelRightsFetcher.getOperatorsOfParcel(X, Y)
          expect(result).toEqual({
            owner: ESTATE_OWNER_ADDRESS,
            operator: null,
            updateOperator: null,
            updateManagers: [],
            approvedForAll: []
          })
        })
      })
    })

    describe('when parcel and estate do not exist', () => {
      beforeEach(() => {
        mockLandSubgraphQuery.mockResolvedValue({
          parcels: [],
          estates: []
        })
      })

      it('should throw ParcelOrStateNotFoundError', async () => {
        await expect(parcelRightsFetcher.getOperatorsOfParcel(X, Y)).rejects.toThrow(
          new ParcelOrStateNotFoundError(X, Y)
        )
      })
    })
  })

  describe('getParcelPermissions', () => {
    const X = 10
    const Y = 20
    const USER_ADDRESS = '0xuseraddress'
    const OWNER_ADDRESS = '0xowner'
    let parcel: any
    let authorizations: Authorization[]

    beforeEach(() => {
      authorizations = []
      parcel = {
        x: X.toString(),
        y: Y.toString(),
        owner: { address: OWNER_ADDRESS },
        operator: null,
        updateOperator: null
      }
      mockLandSubgraphQuery.mockImplementation(async (query: string) => {
        if (query.includes('fetchOperatorsOfParcel')) {
          return {
            parcels: [parcel],
            estates: []
          }
        }
        if (query.includes('fetchAuthorizations')) {
          return { authorizations }
        }
        return {}
      })
    })

    describe('when user has all permissions', () => {
      beforeEach(() => {
        authorizations.push(
          {
            type: AuthorizationType.UpdateManager,
            operator: USER_ADDRESS,
            isApproved: true,
            timestamp: 1
          },
          {
            type: AuthorizationType.Operator,
            operator: USER_ADDRESS,
            isApproved: true,
            timestamp: 2
          }
        )
        parcel.operator = USER_ADDRESS
        parcel.updateOperator = USER_ADDRESS
      })

      it('should return all permissions as true', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions).toEqual({
          owner: false,
          operator: true,
          updateOperator: true,
          updateManager: true,
          approvedForAll: true
        })
      })
    })

    describe('when user is the owner only', () => {
      beforeEach(() => {
        parcel.owner.address = USER_ADDRESS
      })

      it('should return owner as true and others as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions).toEqual({
          owner: true,
          operator: false,
          updateOperator: false,
          updateManager: false,
          approvedForAll: false
        })
      })
    })

    describe('when user is an operator only', () => {
      beforeEach(() => {
        parcel.operator = USER_ADDRESS
      })

      it('should return operator as true and others as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions.owner).toBe(false)
        expect(permissions.operator).toBe(true)
        expect(permissions.updateOperator).toBe(false)
        expect(permissions.updateManager).toBe(false)
        expect(permissions.approvedForAll).toBe(false)
      })
    })

    describe('when user is an update operator only', () => {
      beforeEach(() => {
        parcel.updateOperator = USER_ADDRESS
      })

      it('should return updateOperator as true and others as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions).toEqual({
          owner: false,
          operator: false,
          updateOperator: true,
          updateManager: false,
          approvedForAll: false
        })
      })
    })

    describe('when user is an update manager only', () => {
      beforeEach(() => {
        authorizations.push({
          type: AuthorizationType.UpdateManager,
          operator: USER_ADDRESS,
          isApproved: true,
          timestamp: 1
        })
      })

      it('should return updateManager as true and others as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions).toEqual({
          owner: false,
          operator: false,
          updateOperator: false,
          updateManager: true,
          approvedForAll: false
        })
      })
    })

    describe('when user is approved for all only', () => {
      beforeEach(() => {
        authorizations.push({
          type: AuthorizationType.Operator,
          operator: USER_ADDRESS,
          isApproved: true,
          timestamp: 1
        })
      })

      it('should return approvedForAll as true and others as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions).toEqual({
          owner: false,
          operator: false,
          updateOperator: false,
          updateManager: false,
          approvedForAll: true
        })
      })
    })

    describe('when user has no permissions', () => {
      it('should return all permissions as false', async () => {
        const permissions = await parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)
        expect(permissions.owner).toBe(false)
        expect(permissions.operator).toBe(false)
        expect(permissions.updateOperator).toBe(false)
        expect(permissions.updateManager).toBe(false)
        expect(permissions.approvedForAll).toBe(false)
      })
    })

    describe('when getOperatorsOfParcel throws an error', () => {
      const ERROR_MESSAGE = 'Parcel not found'
      beforeEach(() => {
        mockLandSubgraphQuery.mockRejectedValue(new Error(ERROR_MESSAGE))
      })

      it('should propagate the error', async () => {
        await expect(parcelRightsFetcher.getParcelPermissions(USER_ADDRESS, X, Y)).rejects.toThrow(ERROR_MESSAGE)
      })
    })
  })
})
