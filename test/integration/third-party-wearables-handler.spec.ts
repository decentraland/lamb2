import { test, testWithComponents } from '../components'
import { generateDefinitions, generateWearables } from '../data/wearables'
import Wallet from 'ethereumjs-wallet'
import { ItemFromQuery } from '../../src/adapters/items-fetcher'
import { Item } from '../../src/types'
import { ThirdParty, ThirdPartyResolversResponse } from '../../src/adapters/third-party-wearables-fetcher'
import { IFetchComponent } from '@well-known-components/http-server'
import { TheGraphComponent } from '../../src/ports/the-graph'
import { createTheGraphComponentMock } from '../mocks/the-graph-mock'

// NOTE: each test generates a new wallet using ethereumjs-wallet to avoid matches on cache
testWithComponents(() => {
  const theGraphMock = createTheGraphComponentMock()
  const resolverResponse: ThirdPartyResolversResponse[] = [{
    thirdParties: [{
      id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
      resolver: 'https://decentraland-api.babydoge.com/v1'
    }]
  }]

  theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValueOnce(resolverResponse)
  return {
    theGraphComponent: theGraphMock
  }
})('third-party-wearables-handler: GET /users/:address/third-party-wearables should', function ({ components }) {

  it.only('return empty when no wearables are found', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })
})


