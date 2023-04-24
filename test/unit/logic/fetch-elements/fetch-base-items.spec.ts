import { fetchAllBaseWearables } from '../../../../src/logic/fetch-elements/fetch-base-items'

describe('fetchBaseWearables', () => {
  it('returns all base wearables', async () => {
    const baseWearables = await fetchAllBaseWearables()
    expect(baseWearables.length).toBe(278)
  })
})
