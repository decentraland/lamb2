import { ParcelOperators } from '../../src/adapters/parcel-rights-fetcher'
import { test } from '../components'
import { generateRandomAddress } from '../helpers'

test('integration tests for parcel operators handler', function ({ components, stubComponents }) {
  it('should respond with a 200 and the correct owner and operator when parcel exists', async () => {
    const { localFetch } = components
    const ownerAddress = generateRandomAddress()
    const operatorAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelRightsFetcher.getOperatorsOfParcel.resolves({
      owner: ownerAddress,
      operator: operatorAddress
    } as ParcelOperators)

    const r = await localFetch.fetch(`/parcels/${parcelX}/${parcelY}/operators`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: ownerAddress,
      operator: operatorAddress
    })
  })

  it('should respond with a 200 and the correct owner and operator when estate exists', async () => {
    const { localFetch } = components
    const ownerAddress = generateRandomAddress()
    const operatorAddress = generateRandomAddress()
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelRightsFetcher.getOperatorsOfParcel.resolves({
      owner: ownerAddress.toLowerCase(),
      operator: operatorAddress.toLowerCase()
    } as ParcelOperators)

    const r = await localFetch.fetch(`/parcels/${parcelX}/${parcelY}/operators`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: ownerAddress.toLowerCase(),
      operator: operatorAddress.toLowerCase()
    })
  })

  it('should respond with a 200 and empty strings when no operators exist', async () => {
    const { localFetch } = components
    const parcelX = 10
    const parcelY = 20

    stubComponents.parcelRightsFetcher.getOperatorsOfParcel.resolves({
      owner: ''
    } as ParcelOperators)

    const r = await localFetch.fetch(`/parcels/${parcelX}/${parcelY}/operators`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      owner: ''
    })
  })

  it('should return 400 when coordinates are not valid numbers', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/parcels/invalid/coord/operators')

    expect(r.status).toBe(400)
    const response = await r.json()
    expect(response.error).toBeDefined()
    expect(response.message).toContain('Coordinates X and Y must be valid numbers')
  })

  it('should return 400 when coordinates are valid numbers but not valid parcel coordinates', async () => {
    const { localFetch } = components
    const parcelX = 9999999
    const parcelY = 9999999

    const r = await localFetch.fetch(`/parcels/${parcelX}/${parcelY}/operators`)

    expect(r.status).toBe(400)
    const response = await r.json()
    expect(response.error).toBeDefined()
    expect(response.message).toContain('Coordinates X and Y must be valid numbers')
  })
})
