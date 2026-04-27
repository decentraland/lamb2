import { test } from '../components'
import { profileEntityFullWithExtendedItems } from './data/profiles-responses'
import { generateRandomAddress } from '../helpers'

test('profile alias: GET /profile/:id mirrors /profiles/:id', function ({ components }) {
  const address = generateRandomAddress()
  const profile = { timestamp: Date.now(), ...profileEntityFullWithExtendedItems.metadata }

  beforeEach(() => {
    components.profiles.getProfile = jest.fn().mockResolvedValue(profile)
  })

  describe('when both /profile/:id and /profiles/:id are fetched for the same address', () => {
    it('returns identical bodies', async () => {
      const { localFetch } = components

      const [aliasResponse, canonicalResponse] = await Promise.all([
        localFetch.fetch(`/profile/${address}`),
        localFetch.fetch(`/profiles/${address}`)
      ])

      expect(aliasResponse.status).toBe(200)
      expect(canonicalResponse.status).toBe(200)

      const aliasBody = await aliasResponse.json()
      const canonicalBody = await canonicalResponse.json()

      expect(aliasBody).toEqual(canonicalBody)
    })

    it('calls profiles.getProfile with the address for both routes', async () => {
      const { localFetch } = components

      await localFetch.fetch(`/profile/${address}`)
      await localFetch.fetch(`/profiles/${address}`)

      expect(components.profiles.getProfile).toHaveBeenCalledWith(address)
      expect(components.profiles.getProfile).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the profile is not found', () => {
    beforeEach(() => {
      components.profiles.getProfile = jest.fn().mockResolvedValue(undefined)
    })

    it('responds 404 on /profile/:id (proves the alias goes through the same NotFoundError mapping)', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch(`/profile/${address}`)

      expect(r.status).toBe(404)
    })
  })
})
