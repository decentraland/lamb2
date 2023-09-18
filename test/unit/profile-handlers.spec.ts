import {
  explorerProfileHandler,
  profileHandler,
  profilesHandler
} from '../../src/controllers/handlers/profiles-handler'
import { InvalidRequestError, NotFoundError, ProfileMetadata } from '../../src/types'
import { generateRandomAddress } from '../helpers'
import { profileEntityFullWithExtendedItems } from '../integration/data/profiles-responses'
import { Request } from 'node-fetch'
import { createIdentityComponent } from '../../src/adapters/identity'
import { createHasherComponent } from '../../src/adapters/hasher'
import EthCrypto from 'eth-crypto'
import { hashV1 } from '@dcl/hashing'

const profile = { timestamp: Date.now(), ...profileEntityFullWithExtendedItems.metadata }

describe('GET /profiles/{id} handler unit test', () => {
  const address = generateRandomAddress()

  function mockComponents(profileResponse: ProfileMetadata | undefined) {
    return {
      profiles: {
        getProfiles: jest.fn().mockImplementation(async () => undefined),
        getProfile: jest.fn().mockImplementation(async () => profileResponse)
      }
    }
  }

  it('profile not found should return NotFoundError', async () => {
    const components = mockComponents(undefined)

    expect(profileHandler({ components, params: { id: address } })).rejects.toThrowError(NotFoundError)
    expect(components.profiles.getProfiles).not.toHaveBeenCalled()
    expect(components.profiles.getProfile).toHaveBeenCalledWith(address)
  })

  it('profile should be returned', async () => {
    const components = mockComponents(profile)
    const { status, body } = await profileHandler({ components, params: { id: address } })
    expect(components.profiles.getProfiles).not.toHaveBeenCalled()
    expect(components.profiles.getProfile).toHaveBeenCalledWith(address)

    expect(status).toEqual(200)
    expect(body).toEqual(profile)
  })
})

describe('POST /profiles handler unit test', () => {
  const addresses = [generateRandomAddress(), generateRandomAddress(), generateRandomAddress()]

  function mockComponents(profilesResponse: ProfileMetadata[] | undefined) {
    return {
      profiles: {
        getProfiles: jest.fn().mockImplementation(async () => profilesResponse),
        getProfile: jest.fn().mockImplementation(async () => undefined)
      }
    }
  }

  function makeRequest(body: any, headers?: Record<string, string>) {
    const request = new Request(new URL('http://localhost/profiles'), {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headers ?? {}
    })
    return request
  }

  it('when ids are not provided it should throw InvalidRequestError', async () => {
    const components = mockComponents(undefined)
    const request = makeRequest({})

    expect(profilesHandler({ components, request })).rejects.toThrowError(InvalidRequestError)
  })

  it('profiles should be returned when if-modified-since is not provided', async () => {
    const components = mockComponents([profile])
    const request = makeRequest({ ids: addresses })
    const response = await profilesHandler({ components, request })
    expect(components.profiles.getProfile).not.toHaveBeenCalled()
    expect(components.profiles.getProfiles).toHaveBeenCalledWith(addresses, undefined)

    expect(response.status).toEqual(200)

    if (response.status === 200) {
      expect(response.body).toEqual([profile])
    }
  })

  it('profiles should be returned when if-modified-since is provided', async () => {
    const now = Date.now()

    const components = mockComponents([profile])
    const request = makeRequest(
      { ids: addresses },
      {
        'if-modified-since': new Date(now).toISOString()
      }
    )

    const response = await profilesHandler({ components, request })
    expect(components.profiles.getProfile).not.toHaveBeenCalled()
    expect(components.profiles.getProfiles).toHaveBeenCalledWith(addresses, now)

    expect(response.status).toEqual(200)

    if (response.status === 200) {
      expect(response.body).toEqual([profile])
    }
  })

  it('profiles should be returned when if-modified-since is provided and is invalid', async () => {
    const components = mockComponents([profile])
    const request = makeRequest(
      { ids: addresses },
      {
        'if-modified-since': 'invalid'
      }
    )

    const response = await profilesHandler({ components, request })
    expect(components.profiles.getProfile).not.toHaveBeenCalled()
    expect(components.profiles.getProfiles).toHaveBeenCalledWith(addresses, undefined)

    expect(response.status).toEqual(200)

    if (response.status === 200) {
      expect(response.body).toEqual([profile])
    }
  })

  it('304 should be returned if there is no modification since if-modified-since', async () => {
    const now = Date.now()

    const components = mockComponents(undefined)
    const request = makeRequest(
      { ids: addresses },
      {
        'if-modified-since': new Date(now).toISOString()
      }
    )

    const response = await profilesHandler({ components, request })
    expect(components.profiles.getProfile).not.toHaveBeenCalled()
    expect(components.profiles.getProfiles).toHaveBeenCalledWith(addresses, now)

    expect(response.status).toEqual(304)
  })
})

describe('GET /explorer/profiles/{id} handler unit test', () => {
  const address = generateRandomAddress()

  function mockComponents(profileResponse: ProfileMetadata | undefined) {
    return {
      profiles: {
        getProfiles: jest.fn().mockImplementation(async () => undefined),
        getProfile: jest.fn().mockImplementation(async () => profileResponse)
      },
      identity: {
        getPublicKey: () => 'public_key',
        getAddress: () => 'address',
        sign: jest.fn().mockImplementation(() => 'signed')
      },
      hasher: {
        hash: jest.fn().mockImplementation(() => 'hash')
      }
    }
  }

  it('profile not found should return NotFoundError', async () => {
    const components = mockComponents(undefined)

    expect(explorerProfileHandler({ components, params: { id: address } })).rejects.toThrowError(NotFoundError)
    expect(components.profiles.getProfiles).not.toHaveBeenCalled()
    expect(components.profiles.getProfile).toHaveBeenCalledWith(address)
  })

  it('profile should be returned with hash and signedHash', async () => {
    const components = mockComponents(profile)
    const { status, body } = await explorerProfileHandler({ components, params: { id: address } })

    const avatar = profile.avatars[0]
    expect(components.profiles.getProfiles).not.toHaveBeenCalled()
    expect(components.profiles.getProfile).toHaveBeenCalledWith(address)
    expect(components.hasher.hash).toHaveBeenCalledWith(
      JSON.stringify([avatar.name, avatar.hasClaimedName, ...avatar.avatar.wearables])
    )
    expect(components.identity.sign).toHaveBeenCalledWith('hash')

    expect(status).toEqual(200)
    expect(body.profile).toEqual(profile)
    expect(body.hash).toEqual('hash')
    expect(body.signedHash).toEqual('signed')
  })

  it('profile should be returned with hash and signedHash (using real hash and identity), and validation should be ok', async () => {
    const components = {
      profiles: {
        getProfiles: jest.fn().mockImplementation(async () => undefined),
        getProfile: jest.fn().mockImplementation(async () => profile)
      },
      hasher: createHasherComponent(),
      identity: createIdentityComponent()
    }
    const { status, body } = await explorerProfileHandler({ components, params: { id: address } })

    const avatar = profile.avatars[0]
    expect(components.profiles.getProfiles).not.toHaveBeenCalled()
    expect(components.profiles.getProfile).toHaveBeenCalledWith(address)

    expect(status).toEqual(200)
    expect(body.profile).toEqual(profile)
    expect(body.hash).toBeTruthy()
    expect(body.signedHash).toBeTruthy()

    const encoder = new TextEncoder()

    const payload = JSON.stringify([avatar.name, avatar.hasClaimedName, ...avatar.avatar.wearables])
    expect(await hashV1(encoder.encode(payload))).toEqual(body.hash)
    expect(EthCrypto.recover(body.signedHash, EthCrypto.hash.keccak256(body.hash))).toEqual(
      components.identity.getAddress()
    )
  })
})
