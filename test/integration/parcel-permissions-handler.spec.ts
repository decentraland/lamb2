import { ParcelPermissions } from '../../src/adapters/parcel-permissions-fetcher'
import { test } from '../components'
import { generateRandomAddress } from '../helpers'

test('integration tests for parcel permissions handler', function ({ components }) {
  it('should return permissions when the user is the owner of the parcel', async () => {
    const { localFetch, parcelPermissionsFetcher } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    parcelPermissionsFetcher.getParcelPermissions = jest.fn().mockResolvedValueOnce({
      address: true,
      operator: false
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      address: true,
      operator: false
    })
    expect(parcelPermissionsFetcher.getParcelPermissions).toHaveBeenCalledWith(userAddress, parcelX, parcelY)
  })

  it('should return permissions when the user is the operator of the parcel', async () => {
    const { localFetch, parcelPermissionsFetcher } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    parcelPermissionsFetcher.getParcelPermissions = jest.fn().mockResolvedValueOnce({
      address: false,
      operator: true
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      address: false,
      operator: true
    })
  })

  it('should return permissions when the user has no rights on the parcel', async () => {
    const { localFetch, parcelPermissionsFetcher } = components
    const userAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    parcelPermissionsFetcher.getParcelPermissions = jest.fn().mockResolvedValueOnce({
      address: false,
      operator: false
    } as ParcelPermissions)

    const r = await localFetch.fetch(`/users/${userAddress}/parcels/${parcelX}/${parcelY}/permissions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      address: false,
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
