import { profileHandler, profilesHandler } from '../../src/controllers/handlers/profiles-handler'
import { InvalidRequestError, NotFoundError, ProfileMetadata } from '../../src/types'
import { generateRandomAddress } from '../helpers'
import { profileEntityFullWithExtendedItems } from '../integration/data/profiles-responses'
import { Request } from 'node-fetch'
import { sanitizeLinks } from '../../src/adapters/profiles'

const profile = { timestamp: Date.now(), ...profileEntityFullWithExtendedItems.metadata }

describe('sanitizeLinks', () => {
  describe('when links is undefined', () => {
    it('returns undefined', () => {
      expect(sanitizeLinks(undefined)).toBeUndefined()
    })
  })

  describe('when links is empty', () => {
    it('returns an empty array', () => {
      expect(sanitizeLinks([])).toEqual([])
    })
  })

  describe('when all links have valid URLs', () => {
    it('returns them unchanged', () => {
      const links = [
        { title: 'X', url: 'https://twitter.com/decentraland' },
        { title: 'Website', url: 'https://decentraland.org' }
      ]
      expect(sanitizeLinks(links)).toEqual(links)
    })
  })

  describe('when a link URL is URL-encoded', () => {
    it('returns the link with the decoded URL', () => {
      const links = [{ title: 'X', url: 'https%3a%2f%2ftwitter.com%2fmimomi_o_O' }]
      expect(sanitizeLinks(links)).toEqual([{ title: 'X', url: 'https://twitter.com/mimomi_o_O' }])
    })
  })

  describe('when a link URL is invalid and cannot be decoded to a valid URL', () => {
    it('drops the link', () => {
      const links = [{ title: 'Bad', url: 'not-a-url-at-all' }]
      expect(sanitizeLinks(links)).toEqual([])
    })
  })

  describe('when links contain a mix of valid, encoded, and invalid URLs', () => {
    it('returns valid and decoded links, dropping invalid ones', () => {
      const links = [
        { title: 'Valid', url: 'https://example.com' },
        { title: 'Encoded', url: 'https%3a%2f%2ftwitter.com%2fuser' },
        { title: 'Invalid', url: 'garbage' }
      ]
      expect(sanitizeLinks(links)).toEqual([
        { title: 'Valid', url: 'https://example.com' },
        { title: 'Encoded', url: 'https://twitter.com/user' }
      ])
    })
  })
})

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
