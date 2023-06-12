import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createThirdPartyProvidersServiceFetcherComponent } from '../../../src/adapters/third-party-providers-service-fetcher'
import { ThirdPartyProvider } from '../../../src/types'

describe('third-party-providers-service-fetcher', () => {
  it('should call service when USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE is set', async () => {
    // Arrange
    const config = await createConfigComponent({ USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE: 'true' })
    const mockedFetch = {
      fetch: jest.fn().mockResolvedValue({ json: async () => Promise.resolve({}) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent(
      {
        config,
        fetch: mockedFetch
      },
      'mumbai'
    )

    // Act
    await sut.get()

    // Assert
    expect(mockedFetch.fetch).toHaveBeenCalled()
  })

  it('should throw an error when USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE is not set', async () => {
    // Arrange
    const config = await createConfigComponent({})
    const mockedFetch = {
      fetch: jest.fn().mockResolvedValue({ json: async () => Promise.resolve({}) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent(
      {
        config,
        fetch: mockedFetch
      },
      'mumbai'
    )

    // Act & Assert
    await expect(sut.get()).rejects.toThrow(
      'The environment variable USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE must be set to fetch providers from service'
    )
    expect(mockedFetch.fetch).not.toHaveBeenCalled()
  })

  it('should return fetched Third Party Providers', async () => {
    // Arrange
    const expectedResponse = [
      {
        id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
        resolver: 'https://decentraland-api.babydoge.com/v1'
      },
      {
        id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars',
        resolver: 'https://api.cryptoavatars.io/'
      },
      {
        id: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip',
        resolver: 'https://wearables-api.unxd.com'
      }
    ]
    const config = await createConfigComponent({ USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE: 'true' })
    const mockedFetch = {
      fetch: jest
        .fn()
        .mockResolvedValue({ json: async () => Promise.resolve({ thirdPartyProviders: expectedResponse }) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent(
      {
        config,
        fetch: mockedFetch
      },
      'mumbai'
    )

    // Act
    const response = await sut.get()

    // Assert
    expect(response).toEqual(expectedResponse)
  })
})
