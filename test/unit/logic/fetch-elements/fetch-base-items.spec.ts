import { fetchAllBaseWearables } from '../../../../src/logic/fetch-elements/fetch-base-items'
import { DefinitionsFetcher } from '../../../../src/adapters/definitions-fetcher'
import { WearableCategory, WearableDefinition } from '@dcl/schemas'

const wearableDefinitionsFetcher: DefinitionsFetcher<WearableDefinition> = {
  fetchItemsDefinitions: (urns: string[]): Promise<WearableDefinition[]> =>
    Promise.resolve(
      urns.map(
        (urn: string): WearableDefinition => ({
          id: urn,
          name: urn,
          description: urn,
          thumbnail: 'https://peer.decentraland.org/content/contents/QmYnUSpzttqtqwc6hcRoTZK8eMeC7BuW5ryCNyGZLp4TuW',
          image:
            'https://peer.decentraland.org/content/contents/bafkreif3tj64xucfstdxajt5rd2ecccrj56baarnuo7esqdbffrlq272me',
          data: {
            replaces: [],
            hides: [],
            tags: [],
            representations: [],
            category: WearableCategory.EYEWEAR
          },
          i18n: []
        })
      )
    )
}

describe('fetchBaseWearables', () => {
  it('returns all base wearables', async () => {
    const baseWearables = await fetchAllBaseWearables({ wearableDefinitionsFetcher })
    expect(baseWearables.length).toBe(278)
  })
})
