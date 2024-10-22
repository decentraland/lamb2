import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createThirdPartyProvidersServiceFetcherComponent } from '../../../src/adapters/third-party-providers-service-fetcher'
import { getThirdPartyProviders } from '../../data/wearables'

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
      'amoy'
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
      'amoy'
    )

    // Act & Assert
    await expect(sut.get()).rejects.toThrow(
      'Third Party Providers resolver service will not be used since DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE is set'
    )
    expect(mockedFetch.fetch).not.toHaveBeenCalled()
  })

  it('should return fetched Third Party Providers', async () => {
    // Arrange
    const expectedResponse = getThirdPartyProviders()

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
      'amoy'
    )

    // Act
    const response = await sut.get()

    // Assert
    expect(response).toEqual(expectedResponse)
  })
})
