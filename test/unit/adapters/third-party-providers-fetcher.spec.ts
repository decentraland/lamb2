import { createLogComponent } from "@well-known-components/logger"
import { createTheGraphComponentMock } from "../../mocks/the-graph-mock"
import { createThirdPartyProvidersFetcherComponent, ThirdPartyProviderError } from "../../../src/adapters/third-party-providers-fetcher"
import { parseUrn } from "@dcl/urn-resolver"

it('fails to start if fetch fails', async () => {
  const logs = await createLogComponent({})
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.thirdPartyRegistrySubgraph, 'query').mockRejectedValue({})
  const thirdPartyProviders = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  await expect(thirdPartyProviders.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })).rejects.toThrow(ThirdPartyProviderError)
})

it('if fetch success, it starts ok', async () => {
  const logs = await createLogComponent({})
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.thirdPartyRegistrySubgraph, 'query').mockResolvedValue({
    thirdParties: [
      {
        id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
        resolver: "https://decentraland-api.babydoge.com/v1"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
        resolver: "https://api.cryptoavatars.io/"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
        resolver: "https://wearables-api.unxd.com"
      }
    ]
  })
  const thirdPartyProviders = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  await thirdPartyProviders.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })
  const thirdParties = await thirdPartyProviders.getAll()
  expect(thirdParties).toEqual(expect.arrayContaining([
    {
      id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
      resolver: "https://decentraland-api.babydoge.com/v1"
    },
    {
      id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
      resolver: "https://api.cryptoavatars.io/"
    },
    {
      id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
      resolver: "https://wearables-api.unxd.com"
    }
  ]))
})

it('it gest only the third party specified', async () => {
  const logs = await createLogComponent({})
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.thirdPartyRegistrySubgraph, 'query').mockResolvedValue({
    thirdParties: [
      {
        id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
        resolver: "https://decentraland-api.babydoge.com/v1"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
        resolver: "https://api.cryptoavatars.io/"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
        resolver: "https://wearables-api.unxd.com"
      }
    ]
  })
  const thirdPartyProviders = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  await thirdPartyProviders.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })
  const thirdPartyNameUrn = await parseUrn("urn:decentraland:matic:collections-thirdparty:cryptoavatars")
  if (thirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
    throw new Error('test failed')
  }
  const thirdParty = await thirdPartyProviders.get(thirdPartyNameUrn)
  expect(thirdParty).toEqual({
    id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
    resolver: "https://api.cryptoavatars.io/"
  })
})

it('it returns undefined if the third party specified is non existen', async () => {
  const logs = await createLogComponent({})
  const theGraph = createTheGraphComponentMock()
  jest.spyOn(theGraph.thirdPartyRegistrySubgraph, 'query').mockResolvedValue({
    thirdParties: [
      {
        id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
        resolver: "https://decentraland-api.babydoge.com/v1"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
        resolver: "https://api.cryptoavatars.io/"
      },
      {
        id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
        resolver: "https://wearables-api.unxd.com"
      }
    ]
  })
  const thirdPartyProviders = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  await thirdPartyProviders.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })
  const nonExistentThirdPartyNameUrn = await parseUrn("urn:decentraland:matic:collections-thirdparty:non-existent")
  if (nonExistentThirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
    throw new Error('test failed')
  }
  const thirdParty = await thirdPartyProviders.get(nonExistentThirdPartyNameUrn)
  expect(thirdParty).toBeUndefined()
})

