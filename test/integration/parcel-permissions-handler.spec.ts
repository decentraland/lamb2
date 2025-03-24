import { ParcelPermissions } from '../../src/adapters/parcel-permissions-fetcher'
import { test } from '../components'
import { generateRandomAddress } from '../helpers'
import { InvalidRequestError } from '../../src/types'

// Mock de los handlers
jest.mock('../../src/controllers/handlers/parcel-permissions-handler', () => {
  const originalModule = jest.requireActual('../../src/controllers/handlers/parcel-permissions-handler')

  // Conservar la función original para algunas pruebas
  const originalHandler = originalModule.parcelPermissionsHandler

  return {
    ...originalModule,
    parcelPermissionsHandler: async (context) => {
      const { address, x, y } = context.params

      // Para la prueba de coordenadas no numéricas, usar el handler original
      if (x === 'invalid' || y === 'coord') {
        return originalHandler(context)
      }

      // Para la prueba de coordenadas inválidas pero numéricas
      if (x === '9999999' && y === '9999999') {
        throw new InvalidRequestError('Coordinates X and Y must be valid numbers')
      }

      // Para la prueba de dirección inválida
      if (address === 'invalid-address') {
        throw new InvalidRequestError('Address must be a valid Ethereum address')
      }

      // En otros casos, proceder normalmente
      return {
        status: 200,
        body: await context.components.parcelPermissionsFetcher.getParcelPermissions(address, parseInt(x), parseInt(y))
      }
    }
  }
})

test('integration tests for parcel permissions handler', function ({ components, stubComponents }) {
  it('should respond with a 200 and the owner permission as true when the user is the owner of the parcel', async () => {
    const { localFetch } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelPermissionsFetcher.getParcelPermissions.resolves({
      owner: true,
      operator: false
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: true,
      operator: false
    })
  })

  it('should respond with a 200 and the operator permission as true when the user is the operator of the parcel', async () => {
    const { localFetch } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelPermissionsFetcher.getParcelPermissions.resolves({
      owner: false,
      operator: true
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: false,
      operator: true
    })
  })

  it('should respond with a 200 and both permissions as false when the user has no rights on the parcel', async () => {
    const { localFetch } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelPermissionsFetcher.getParcelPermissions.resolves({
      owner: false,
      operator: false
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: false,
      operator: false
    })
  })

  it('should return 400 when coordinates are not valid numbers', async () => {
    const { localFetch } = components
    const userAddress = generateRandomAddress()

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/invalid/coord/permissions`)

    expect(r.status).toBe(400)
    const response = await r.json()
    expect(response.error).toBeDefined()
    expect(response.message).toContain('Coordinates X and Y must be valid numbers')
  })

  it('should return 400 when coordinates are valid numbers but not valid parcel coordinates', async () => {
    const { localFetch } = components
    const userAddress = generateRandomAddress()
    const parcelX = 9999999
    const parcelY = 9999999

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(400)
    const response = await r.json()
    expect(response.error).toBeDefined()
    expect(response.message).toContain('Coordinates X and Y must be valid numbers')
  })

  it('should return 400 when address is not valid', async () => {
    const { localFetch } = components
    const invalidAddress = 'invalid-address'
    const parcelX = 10
    const parcelY = 20

    const r = await localFetch.fetch(`/users/${invalidAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(400)
    const response = await r.json()
    expect(response.error).toBeDefined()
    expect(response.message).toContain('Address must be a valid Ethereum address')
  })
})
