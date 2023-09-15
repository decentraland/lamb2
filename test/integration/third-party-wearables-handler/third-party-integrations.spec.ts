import { testWithComponents } from '../../components'
import { getThirdPartyProviders } from '../../data/wearables'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'

// NOTE: each test generates a new wallet to avoid matches on cache
testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse = {
    thirdParties: getThirdPartyProviders()
  }

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('third-party-integrations-handler: GET /third-party-integrations', function ({ components }) {
  it('return all integrations', async () => {
    const { localFetch, fetch } = components

    fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({ assets: [] }) })

    const r = await localFetch.fetch(`/third-party-integrations`)

    expect(r.status).toBe(200)
    const response = await r.json()

    expect(response.data).toHaveLength(3)
    expect(response.data).toEqual([
      {
        name: 'baby doge coin',
        description: 'baby doge coin',
        urn: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
      },
      {
        name: 'crypto avatars',
        description: 'avatars',
        urn: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars'
      },
      {
        name: 'disco',
        description: 'disco',
        urn: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip'
      }
    ])
  })
})
