import {
  IConfigComponent,
  ILoggerComponent,
  IFetchComponent,
  IMetricsComponent
} from '@well-known-components/interfaces'
import { ThirdPartyProvidersStorage } from '../../src/logic/third-party-providers-storage'
import { EntitiesFetcher } from '../../src/adapters/entities-fetcher'

export function createConfigMock(): IConfigComponent {
  return {
    getString: jest.fn(),
    getNumber: jest.fn(),
    requireString: jest.fn(),
    requireNumber: jest.fn()
  }
}

export function createLogsMock(): ILoggerComponent {
  const mockLogger: ILoggerComponent.ILogger = {
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }

  return {
    getLogger: jest.fn().mockReturnValue(mockLogger)
  } as any
}

export function createThirdPartyProvidersStorageMock(): ThirdPartyProvidersStorage {
  return {
    getAll: jest.fn(),
    get: jest.fn()
  } as any
}

export function createEntitiesFetcherMock(): EntitiesFetcher {
  return {
    fetchEntities: jest.fn(),
    fetchCollectionEntities: jest.fn()
  } as any
}

export function createFetchMock(): IFetchComponent {
  return {
    fetch: jest.fn()
  } as any
}
