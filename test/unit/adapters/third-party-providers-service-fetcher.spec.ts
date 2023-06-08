import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createThirdPartyProvidersServiceFetcherComponent } from '../../../src/adapters/third-party-providers-service-fetcher'
import { ThirdPartyProvider } from '../../../src/types'

describe('third-party-providers-service-fetcher', () => {
  it('should call service when THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL is set', async () => {
    // Arrange
    const config = await createConfigComponent({ THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL: 'https://an-url.test' })
    const mockedFetch = {
      fetch: jest.fn().mockResolvedValue({ json: async () => Promise.resolve({}) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent({
      config,
      fetch: mockedFetch
    })

    // Act
    await sut.get()

    // Assert
    expect(mockedFetch.fetch).toHaveBeenCalled()
  })

  it('should throw an error when THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL is not set', async () => {
    // Arrange
    const config = await createConfigComponent({})
    const mockedFetch = {
      fetch: jest.fn().mockResolvedValue({ json: async () => Promise.resolve({}) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent({
      config,
      fetch: mockedFetch
    })

    // Act & Assert
    await expect(sut.get()).rejects.toThrow(
      'Could not fetch Third Party Providers from service since the environment variable THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL is missing'
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
    const config = await createConfigComponent({ THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL: 'https://an-url.test' })
    const mockedFetch = {
      fetch: jest
        .fn()
        .mockResolvedValue({ json: async () => Promise.resolve({ thirdPartyProviders: expectedResponse }) })
    }
    const sut = await createThirdPartyProvidersServiceFetcherComponent({
      config,
      fetch: mockedFetch
    })

    // Act
    const response = await sut.get()

    // Assert
    expect(response).toEqual(expectedResponse)
  })
})
