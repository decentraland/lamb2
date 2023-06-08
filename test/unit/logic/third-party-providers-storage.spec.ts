import { createLogComponent } from '@well-known-components/logger'
import { createThirdPartyProvidersStorage } from '../../../src/logic/third-party-providers-storage'
import { FetcherError } from '../../../src/adapters/elements-fetcher'
import { parseUrn } from '@dcl/urn-resolver'

describe('third-party-providers-storage', () => {
  const thirdPartyProviders = [
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

  it('should fail while starting if initial fetch could not be performed', async () => {
    // Arrange
    const logs = await createLogComponent({})
    const thirdPartyProvidersGraphFetcherMock = {
      get: () => Promise.reject(new Error())
    }
    const thirdPartyProvidersServiceFetcherMock = {
      get: () => Promise.reject(new Error())
    }

    const sut = await createThirdPartyProvidersStorage({
      logs,
      thirdPartyProvidersGraphFetcher: thirdPartyProvidersGraphFetcherMock,
      thirdPartyProvidersServiceFetcher: thirdPartyProvidersServiceFetcherMock
    })

    // Act & Assert
    await expect(sut.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })).rejects.toThrow(
      FetcherError
    )
  })

  it('should start if providers could be fetched from service', async () => {
    // Arrange
    const logs = await createLogComponent({})
    const thirdPartyProvidersGraphFetcherMock = {
      get: jest.fn().mockRejectedValue(new Error())
    }
    const thirdPartyProvidersServiceFetcherMock = {
      get: jest.fn().mockResolvedValue(thirdPartyProviders)
    }

    const sut = await createThirdPartyProvidersStorage({
      logs,
      thirdPartyProvidersGraphFetcher: thirdPartyProvidersGraphFetcherMock,
      thirdPartyProvidersServiceFetcher: thirdPartyProvidersServiceFetcherMock
    })

    // Act
    await sut.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })
    const response = await sut.getAll()

    // Assert
    expect(response).toEqual(thirdPartyProviders)
    expect(thirdPartyProvidersGraphFetcherMock.get).not.toHaveBeenCalled()
  })

  it('should start if providers could be fetched from graph', async () => {
    // Arrange
    const logs = await createLogComponent({})
    const thirdPartyProvidersGraphFetcherMock = {
      get: jest.fn().mockResolvedValue(thirdPartyProviders)
    }
    const thirdPartyProvidersServiceFetcherMock = {
      get: jest.fn().mockRejectedValue(new Error())
    }

    const sut = await createThirdPartyProvidersStorage({
      logs,
      thirdPartyProvidersGraphFetcher: thirdPartyProvidersGraphFetcherMock,
      thirdPartyProvidersServiceFetcher: thirdPartyProvidersServiceFetcherMock
    })

    // Act
    await sut.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })
    const response = await sut.getAll()

    // Assert
    expect(response).toEqual(thirdPartyProviders)
    expect(thirdPartyProvidersServiceFetcherMock.get).toHaveBeenCalled()
    expect(thirdPartyProvidersGraphFetcherMock.get).toHaveBeenCalled()
  })

  it('should return undefined if the Third Party Provider requested does not exists', async () => {
    // Arrange
    const logs = await createLogComponent({})
    const thirdPartyProvidersGraphFetcherMock = {
      get: jest.fn().mockRejectedValue(new Error())
    }
    const thirdPartyProvidersServiceFetcherMock = {
      get: jest.fn().mockResolvedValue(thirdPartyProviders)
    }

    const sut = await createThirdPartyProvidersStorage({
      logs,
      thirdPartyProvidersGraphFetcher: thirdPartyProvidersGraphFetcherMock,
      thirdPartyProvidersServiceFetcher: thirdPartyProvidersServiceFetcherMock
    })
    const nonExistentThirdPartyNameUrn = await parseUrn('urn:decentraland:matic:collections-thirdparty:non-existent')

    // Act
    await sut.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })

    const response = await sut.get(nonExistentThirdPartyNameUrn as any)

    // Assert
    expect(response).toBeUndefined()
  })

  it('should return the Third Party Provider requested when it exists', async () => {
    // Arrange
    const logs = await createLogComponent({})
    const thirdPartyProvidersGraphFetcherMock = {
      get: jest.fn().mockRejectedValue(new Error())
    }
    const thirdPartyProvidersServiceFetcherMock = {
      get: jest.fn().mockResolvedValue(thirdPartyProviders)
    }

    const sut = await createThirdPartyProvidersStorage({
      logs,
      thirdPartyProvidersGraphFetcher: thirdPartyProvidersGraphFetcherMock,
      thirdPartyProvidersServiceFetcher: thirdPartyProvidersServiceFetcherMock
    })
    const thirdPartyNameUrn = await parseUrn('urn:decentraland:matic:collections-thirdparty:cryptoavatars')

    // Act
    await sut.start({ started: jest.fn(), live: jest.fn(), getComponents: jest.fn() })

    const response = await sut.get(thirdPartyNameUrn as any)

    // Assert
    expect(response).toEqual({
      id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars',
      resolver: 'https://api.cryptoavatars.io/'
    })
  })
})
