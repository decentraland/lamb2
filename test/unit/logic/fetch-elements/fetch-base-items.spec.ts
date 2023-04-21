import { fetchAllBaseEmotes, fetchAllBaseWearables } from '../../../../src/logic/fetch-elements/fetch-base-items'

describe('fetchBaseItems', () => {
  describe('fetchBaseEmotes', () => {
    it('returns all base emotes', async () => {
      const baseEmotes = await fetchAllBaseEmotes()
      expect(baseEmotes.length).toBe(10)
    })
  })

  describe('fetchBaseWearables', () => {
    it('returns all base wearables', async () => {
      const baseEmotes = await fetchAllBaseWearables()
      expect(baseEmotes.length).toBe(278)
    })
  })
})
