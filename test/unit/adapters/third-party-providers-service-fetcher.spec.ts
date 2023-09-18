import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createThirdPartyProvidersServiceFetcherComponent } from '../../../src/adapters/third-party-providers-service-fetcher'

describe('third-party-providers-service-fetcher', () => {
  it('should call service when DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE is not set', async () => {
    // Arrange
    const config = createConfigComponent({ DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE: 'false' })
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

  it('should throw an error when DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE is set', async () => {
    // Arrange
    const config = createConfigComponent({ DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE: 'true' })
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
      'Third Party Providers resolver service will not be used since DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE is set'
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
    const config = createConfigComponent({ DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE: 'false' })
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
