import { fetchAllBaseWearables } from '../../../../src/logic/fetch-elements/fetch-base-items'
import { EntitiesFetcher } from '../../../../src/adapters/entities-fetcher'
import { generateWearableEntities } from '../../../data/wearables'

describe('fetchBaseWearables', () => {
  it('returns all base wearables', async () => {
    const entitiesFetcher: EntitiesFetcher = {
      fetchEntities: async (urns: string[]) => {
        return generateWearableEntities(urns)
      }
    }

    const baseWearables = await fetchAllBaseWearables({ entitiesFetcher })
    expect(baseWearables.length).toBe(282)
  })
})
