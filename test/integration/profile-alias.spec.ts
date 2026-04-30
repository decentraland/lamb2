import { test } from '../components'
import { profileEntityFullWithExtendedItems } from './data/profiles-responses'
import { generateRandomAddress } from '../helpers'

test('profile alias: GET /profile/:id mirrors /profiles/:id', function ({ components }) {
  let address: string

  beforeEach(() => {
    address = generateRandomAddress()
  })

  describe('when the profile exists', () => {
    let profile: { timestamp: number } & Record<string, unknown>
    let aliasResponse: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let canonicalResponse: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let aliasBody: any
    let canonicalBody: any

    beforeEach(async () => {
      profile = { timestamp: Date.now(), ...profileEntityFullWithExtendedItems.metadata } as typeof profile
      components.profiles.getProfile = jest.fn().mockResolvedValue(profile)
      ;[aliasResponse, canonicalResponse] = await Promise.all([
        components.localFetch.fetch(`/profile/${address}`),
        components.localFetch.fetch(`/profiles/${address}`)
      ])
      aliasBody = await aliasResponse.json()
      canonicalBody = await canonicalResponse.json()
    })

    it('should respond 200 on both routes', () => {
      expect(aliasResponse.status).toBe(200)
      expect(canonicalResponse.status).toBe(200)
    })

    it('should return identical bodies on both routes', () => {
      expect(aliasBody).toEqual(canonicalBody)
    })

    it('should call profiles.getProfile with the address exactly once per route', () => {
      expect(components.profiles.getProfile).toHaveBeenCalledWith(address)
      expect(components.profiles.getProfile).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the profile is not found', () => {
    beforeEach(() => {
      components.profiles.getProfile = jest.fn().mockResolvedValue(undefined)
    })

    describe('and the alias /profile/:id is fetched', () => {
      let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
      let body: any

      beforeEach(async () => {
        response = await components.localFetch.fetch(`/profile/${address}`)
        body = await response.json()
      })

      it('should respond 200 with the legacy { avatars: [], timestamp: 0 } stub', () => {
        expect(response.status).toBe(200)
        expect(body).toEqual({ avatars: [], timestamp: 0 })
      })
    })

    describe('and the canonical /profiles/:id is fetched', () => {
      let response: Awaited<ReturnType<typeof components.localFetch.fetch>>

      beforeEach(async () => {
        response = await components.localFetch.fetch(`/profiles/${address}`)
      })

      it('should respond 404 (the contract divergence with the alias is preserved)', () => {
        expect(response.status).toBe(404)
      })
    })
  })
})
