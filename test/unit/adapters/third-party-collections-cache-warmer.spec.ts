import { IConfigComponent, ILoggerComponent, IFetchComponent } from '@well-known-components/interfaces'
import {
  createThirdPartyCollectionsCacheWarmer,
  ThirdPartyCollectionsCacheWarmer
} from '../../../src/adapters/third-party-collections-cache-warmer'
import { AppComponents, ThirdPartyProvider } from '../../../src/types'
import { ThirdPartyProvidersStorage } from '../../../src/logic/third-party-providers-storage'
import { EntitiesFetcher } from '../../../src/adapters/entities-fetcher'
import {
  createConfigMock,
  createLogsMock,
  createThirdPartyProvidersStorageMock,
  createEntitiesFetcherMock,
  createFetchMock
} from '../../mocks/cache-warmer-mocks'

describe('when creating the third-party collections cache warmer component', () => {
  let components: Pick<
    AppComponents,
    'config' | 'logs' | 'thirdPartyProvidersStorage' | 'entitiesFetcher' | 'fetch' | 'contentServerUrl'
  >
  let mockConfig: IConfigComponent
  let mockLogs: ILoggerComponent
  let mockLogger: ILoggerComponent.ILogger
  let mockThirdPartyProvidersStorage: ThirdPartyProvidersStorage
  let mockEntitiesFetcher: EntitiesFetcher
  let mockFetch: IFetchComponent
  let contentServerUrl: string

  beforeEach(() => {
    mockConfig = createConfigMock()
    mockLogs = createLogsMock()
    mockLogger = mockLogs.getLogger('test')
    mockThirdPartyProvidersStorage = createThirdPartyProvidersStorageMock()
    mockEntitiesFetcher = createEntitiesFetcherMock()
    mockFetch = createFetchMock()
    contentServerUrl = 'http://test-content-server.com'

    components = {
      config: mockConfig,
      logs: mockLogs,
      thirdPartyProvidersStorage: mockThirdPartyProvidersStorage,
      entitiesFetcher: mockEntitiesFetcher,
      fetch: mockFetch,
      contentServerUrl
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
  })

  describe('and the cache warmer is disabled', () => {
    beforeEach(() => {
      ;(mockConfig.getString as jest.Mock).mockResolvedValueOnce('false')
      ;(mockConfig.getNumber as jest.Mock).mockResolvedValue(undefined)
    })

    it('should create the component with disabled status', async () => {
      const warmer = await createThirdPartyCollectionsCacheWarmer(components)
      const status = warmer.getStatus()

      expect(status.enabled).toBe(false)
    })
  })

  describe('and the cache warmer is enabled', () => {
    beforeEach(() => {
      ;(mockConfig.getString as jest.Mock).mockResolvedValueOnce('true')
      ;(mockConfig.getNumber as jest.Mock).mockResolvedValue(undefined)
    })

    it('should create the component with enabled status', async () => {
      const warmer = await createThirdPartyCollectionsCacheWarmer(components)
      const status = warmer.getStatus()

      expect(status.enabled).toBe(true)
    })

    it('should initialize status with default values', async () => {
      const warmer = await createThirdPartyCollectionsCacheWarmer(components)
      const status = warmer.getStatus()

      expect(status.collectionsWarmed).toBe(0)
      expect(status.totalCollections).toBe(0)
      expect(status.errors).toEqual([])
      expect(status.isWarming).toBe(false)
    })
  })

  describe('and custom configuration is provided', () => {
    let customWarmupInterval: number
    let customWarmupDelay: number
    let customMaxConcurrent: number
    let customHealthCheckRetry: number
    let customHealthCheckMaxRetries: number

    beforeEach(() => {
      customWarmupInterval = 3600000
      customWarmupDelay = 10000
      customMaxConcurrent = 5
      customHealthCheckRetry = 3000
      customHealthCheckMaxRetries = 10
      ;(mockConfig.getString as jest.Mock).mockResolvedValueOnce('true')
      ;(mockConfig.getNumber as jest.Mock).mockImplementation((key: string) => {
        switch (key) {
          case 'CACHE_WARMER_INTERVAL_MS':
            return Promise.resolve(customWarmupInterval)
          case 'CACHE_WARMER_DELAY_MS':
            return Promise.resolve(customWarmupDelay)
          case 'CACHE_WARMER_MAX_CONCURRENT':
            return Promise.resolve(customMaxConcurrent)
          case 'CACHE_WARMER_HEALTH_CHECK_RETRY_MS':
            return Promise.resolve(customHealthCheckRetry)
          case 'CACHE_WARMER_HEALTH_CHECK_MAX_RETRIES':
            return Promise.resolve(customHealthCheckMaxRetries)
          default:
            return Promise.resolve(undefined)
        }
      })
    })

    it('should create the component with custom configuration', async () => {
      const warmer = await createThirdPartyCollectionsCacheWarmer(components)

      expect(warmer).toBeDefined()
      expect(mockConfig.getNumber).toHaveBeenCalledWith('CACHE_WARMER_INTERVAL_MS')
      expect(mockConfig.getNumber).toHaveBeenCalledWith('CACHE_WARMER_DELAY_MS')
      expect(mockConfig.getNumber).toHaveBeenCalledWith('CACHE_WARMER_MAX_CONCURRENT')
    })
  })
})

describe('when the cache warmer component is disabled', () => {
  let warmer: ThirdPartyCollectionsCacheWarmer
  let components: Pick<
    AppComponents,
    'config' | 'logs' | 'thirdPartyProvidersStorage' | 'entitiesFetcher' | 'fetch' | 'contentServerUrl'
  >
  let mockConfig: IConfigComponent
  let mockLogs: ILoggerComponent
  let mockLogger: ILoggerComponent.ILogger
  let mockThirdPartyProvidersStorage: ThirdPartyProvidersStorage
  let mockEntitiesFetcher: EntitiesFetcher
  let mockFetch: IFetchComponent

  beforeEach(async () => {
    mockConfig = createConfigMock()
    mockLogs = createLogsMock()
    mockLogger = mockLogs.getLogger('test')
    mockThirdPartyProvidersStorage = createThirdPartyProvidersStorageMock()
    mockEntitiesFetcher = createEntitiesFetcherMock()
    mockFetch = createFetchMock()

    components = {
      config: mockConfig,
      logs: mockLogs,
      thirdPartyProvidersStorage: mockThirdPartyProvidersStorage,
      entitiesFetcher: mockEntitiesFetcher,
      fetch: mockFetch,
      contentServerUrl: 'http://test-content-server.com'
    }
    ;(mockConfig.getString as jest.Mock).mockResolvedValueOnce('false')
    ;(mockConfig.getNumber as jest.Mock).mockResolvedValue(undefined)

    warmer = await createThirdPartyCollectionsCacheWarmer(components)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when calling warmCache', () => {
    it('should log that cache warmer is disabled and return early', async () => {
      await warmer.warmCache()

      expect(mockLogger.info).toHaveBeenCalledWith('[warmCache] Cache warmer is disabled')
      expect(mockThirdPartyProvidersStorage.getAll).not.toHaveBeenCalled()
    })
  })

  describe('when calling start', () => {
    it('should log that cache warmer is disabled and not schedule warmups', async () => {
      if (warmer.start) {
        await warmer.start({} as any)
      }

      expect(mockLogger.info).toHaveBeenCalledWith('[start] Cache warmer is disabled via config')
    })
  })
})

describe('when the cache warmer component is enabled', () => {
  let warmer: ThirdPartyCollectionsCacheWarmer
  let components: Pick<
    AppComponents,
    'config' | 'logs' | 'thirdPartyProvidersStorage' | 'entitiesFetcher' | 'fetch' | 'contentServerUrl'
  >
  let mockConfig: IConfigComponent
  let mockLogs: ILoggerComponent
  let mockLogger: ILoggerComponent.ILogger
  let mockThirdPartyProvidersStorage: ThirdPartyProvidersStorage
  let mockEntitiesFetcher: EntitiesFetcher
  let mockFetch: IFetchComponent
  let contentServerUrl: string

  beforeEach(async () => {
    mockConfig = createConfigMock()
    mockLogs = createLogsMock()
    mockLogger = mockLogs.getLogger('test')
    mockThirdPartyProvidersStorage = createThirdPartyProvidersStorageMock()
    mockEntitiesFetcher = createEntitiesFetcherMock()
    mockFetch = createFetchMock()
    contentServerUrl = 'http://test-content-server.com'

    components = {
      config: mockConfig,
      logs: mockLogs,
      thirdPartyProvidersStorage: mockThirdPartyProvidersStorage,
      entitiesFetcher: mockEntitiesFetcher,
      fetch: mockFetch,
      contentServerUrl
    }
    ;(mockConfig.getString as jest.Mock).mockResolvedValueOnce('true')
    ;(mockConfig.getNumber as jest.Mock).mockResolvedValue(undefined)

    warmer = await createThirdPartyCollectionsCacheWarmer(components)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
  })

  describe('when calling warmCache', () => {
    describe('and the content server is ready', () => {
      beforeEach(() => {
        ;(mockFetch.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({
            synchronizationStatus: { synchronizationState: 'Syncing' }
          })
        })
      })

      describe('and there are no providers', () => {
        beforeEach(() => {
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce([])
        })

        it('should not attempt to warm any collections', async () => {
          await warmer.warmCache()

          expect(mockEntitiesFetcher.fetchCollectionEntities).not.toHaveBeenCalled()
        })
      })

      describe('and there are providers without contracts', () => {
        let providers: ThirdPartyProvider[]

        beforeEach(() => {
          providers = [
            {
              id: 'urn:decentraland:matic:collections-thirdparty:test-no-contracts',
              resolver: 'test-resolver',
              metadata: {
                thirdParty: {
                  name: 'Test No Contracts',
                  description: 'A test collection without contracts',
                  contracts: []
                }
              }
            } as ThirdPartyProvider
          ]
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
        })

        it('should skip providers without contracts', async () => {
          await warmer.warmCache()

          expect(mockLogger.warn).toHaveBeenCalledWith('[warmCache] No providers with contracts found')
          expect(mockEntitiesFetcher.fetchCollectionEntities).not.toHaveBeenCalled()
        })
      })

      describe('and there are providers with contracts', () => {
        let providers: ThirdPartyProvider[]
        let entities: any[]

        beforeEach(() => {
          providers = [
            {
              id: 'urn:decentraland:matic:collections-thirdparty:test-collection-1',
              resolver: 'test-resolver',
              metadata: {
                thirdParty: {
                  name: 'Test Collection 1',
                  description: 'Test collection 1 description',
                  contracts: [{ network: 'matic', address: '0x123' }]
                }
              }
            } as ThirdPartyProvider,
            {
              id: 'urn:decentraland:matic:collections-thirdparty:test-collection-2',
              resolver: 'test-resolver',
              metadata: {
                thirdParty: {
                  name: 'Test Collection 2',
                  description: 'Test collection 2 description',
                  contracts: [{ network: 'matic', address: '0x456' }]
                }
              }
            } as ThirdPartyProvider
          ]

          entities = [{ id: 'entity-1' }, { id: 'entity-2' }]
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
          ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockResolvedValue(entities)
        })

        it('should warm all collections successfully', async () => {
          await warmer.warmCache()

          expect(mockEntitiesFetcher.fetchCollectionEntities).toHaveBeenCalledTimes(2)
          expect(mockEntitiesFetcher.fetchCollectionEntities).toHaveBeenCalledWith(providers[0].id)
          expect(mockEntitiesFetcher.fetchCollectionEntities).toHaveBeenCalledWith(providers[1].id)
        })

        it('should update status with collections warmed count', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.collectionsWarmed).toBe(2)
          expect(status.totalCollections).toBe(2)
        })

        it('should set isWarming to false after completion', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.isWarming).toBe(false)
        })

        it('should clear previous errors', async () => {
          // First warmup with error
          ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockRejectedValueOnce(new Error('First error'))
          await warmer.warmCache()

          let status = warmer.getStatus()
          expect(status.errors.length).toBeGreaterThan(0)

          // Second warmup without errors - need to re-mock everything
          ;(mockFetch.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({
              synchronizationStatus: { synchronizationState: 'Syncing' }
            })
          })
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
          ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockResolvedValue(entities)

          await warmer.warmCache()

          status = warmer.getStatus()
          expect(status.errors).toEqual([])
        })
      })

      describe('and some collections fail to warm', () => {
        let providers: ThirdPartyProvider[]
        let entities: any[]
        let errorMessage: string

        beforeEach(() => {
          providers = [
            {
              id: 'urn:decentraland:matic:collections-thirdparty:test-collection-success',
              resolver: 'test-resolver',
              metadata: {
                thirdParty: {
                  name: 'Success Collection',
                  description: 'Success collection description',
                  contracts: [{ network: 'matic', address: '0x123' }]
                }
              }
            } as ThirdPartyProvider,
            {
              id: 'urn:decentraland:matic:collections-thirdparty:test-collection-fail',
              resolver: 'test-resolver',
              metadata: {
                thirdParty: {
                  name: 'Fail Collection',
                  description: 'Fail collection description',
                  contracts: [{ network: 'matic', address: '0x456' }]
                }
              }
            } as ThirdPartyProvider
          ]

          entities = [{ id: 'entity-1' }]
          errorMessage = 'Failed to fetch entities'
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
          ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock)
            .mockResolvedValueOnce(entities)
            .mockRejectedValueOnce(new Error(errorMessage))
        })

        it('should continue warming other collections after a failure', async () => {
          await warmer.warmCache()

          expect(mockEntitiesFetcher.fetchCollectionEntities).toHaveBeenCalledTimes(2)
        })

        it('should log error for failed collection', async () => {
          await warmer.warmCache()

          expect(mockLogger.error).toHaveBeenCalledWith(
            '[warmCollection] Failed to warm collection',
            expect.objectContaining({
              collectionId: providers[1].id,
              providerName: 'Fail Collection',
              error: errorMessage
            })
          )
        })

        it('should add error to status', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.errors).toContain(`${providers[1].id}: ${errorMessage}`)
        })

        it('should update collectionsWarmed count only for successful warmups', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.collectionsWarmed).toBe(1)
          expect(status.totalCollections).toBe(2)
        })
      })

      describe('and a fatal error occurs during warmup', () => {
        let fatalError: Error

        beforeEach(() => {
          fatalError = new Error('Fatal storage error')
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockRejectedValueOnce(fatalError)
        })

        it('should log the fatal error', async () => {
          await warmer.warmCache()

          expect(mockLogger.error).toHaveBeenCalledWith(
            '[warmCache] Fatal error during cache warmup',
            expect.objectContaining({
              error: fatalError.message
            })
          )
        })

        it('should add fatal error to status', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.errors).toContain(`Fatal: ${fatalError.message}`)
        })

        it('should set isWarming to false after error', async () => {
          await warmer.warmCache()

          const status = warmer.getStatus()
          expect(status.isWarming).toBe(false)
        })
      })

      describe('and there are many providers to process in batches', () => {
        let providers: ThirdPartyProvider[]
        let maxConcurrent: number
        let batchWarmer: ThirdPartyCollectionsCacheWarmer

        beforeEach(async () => {
          maxConcurrent = 3

          // Reset config mock to include batch configuration
          const batchConfig = createConfigMock()
          ;(batchConfig.getString as jest.Mock).mockResolvedValueOnce('true')
          ;(batchConfig.getNumber as jest.Mock).mockImplementation((key: string) => {
            if (key === 'CACHE_WARMER_MAX_CONCURRENT') {
              return Promise.resolve(maxConcurrent)
            }
            return Promise.resolve(undefined)
          })

          // Create 7 providers (will be 3 batches: 3, 3, 1)
          providers = Array.from({ length: 7 }, (_, i) => ({
            id: `urn:decentraland:matic:collections-thirdparty:test-collection-${i}`,
            resolver: 'test-resolver',
            metadata: {
              thirdParty: {
                name: `Test Collection ${i}`,
                description: `Test collection ${i} description`,
                contracts: [{ network: 'matic', address: `0x${i}` }]
              }
            }
          })) as ThirdPartyProvider[]
          ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
          ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockResolvedValue([])

          const batchComponents = { ...components, config: batchConfig }
          batchWarmer = await createThirdPartyCollectionsCacheWarmer(batchComponents)
        })

        it('should process collections in batches respecting max concurrent limit', async () => {
          await batchWarmer.warmCache()

          expect(mockEntitiesFetcher.fetchCollectionEntities).toHaveBeenCalledTimes(7)
          expect(mockLogger.info).toHaveBeenCalledWith(
            '[warmCollectionsInBatches] Processing batches',
            expect.objectContaining({
              totalProviders: 7,
              batchCount: 3,
              maxConcurrent: 3
            })
          )
        })

        it('should log each batch being processed', async () => {
          await batchWarmer.warmCache()

          expect(mockLogger.debug).toHaveBeenCalledWith(
            '[warmCollectionsInBatches] Processing batch',
            expect.objectContaining({ batchNumber: 1, batchSize: 3 })
          )
          expect(mockLogger.debug).toHaveBeenCalledWith(
            '[warmCollectionsInBatches] Processing batch',
            expect.objectContaining({ batchNumber: 2, batchSize: 3 })
          )
          expect(mockLogger.debug).toHaveBeenCalledWith(
            '[warmCollectionsInBatches] Processing batch',
            expect.objectContaining({ batchNumber: 3, batchSize: 1 })
          )
        })
      })
    })
  })

  describe('when calling getStatus', () => {
    describe('and the component was just created', () => {
      it('should return initial status', () => {
        const status = warmer.getStatus()

        expect(status).toEqual({
          enabled: true,
          collectionsWarmed: 0,
          totalCollections: 0,
          errors: [],
          isWarming: false
        })
      })
    })

    describe('and warmup has completed successfully', () => {
      let providers: ThirdPartyProvider[]

      beforeEach(async () => {
        providers = [
          {
            id: 'urn:decentraland:matic:collections-thirdparty:test-1',
            resolver: 'test-resolver',
            metadata: {
              thirdParty: {
                name: 'Test 1',
                description: 'Test 1 description',
                contracts: [{ network: 'matic', address: '0x1' }]
              }
            }
          } as ThirdPartyProvider
        ]
        ;(mockFetch.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            synchronizationStatus: { synchronizationState: 'Syncing' }
          })
        })
        ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
        ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockResolvedValueOnce([])

        await warmer.warmCache()
      })

      it('should return updated status with collections warmed', () => {
        const status = warmer.getStatus()

        expect(status.collectionsWarmed).toBe(1)
        expect(status.totalCollections).toBe(1)
        expect(status.isWarming).toBe(false)
        expect(status.errors).toEqual([])
      })
    })

    describe('and warmup has completed with errors', () => {
      let providers: ThirdPartyProvider[]

      beforeEach(async () => {
        providers = [
          {
            id: 'urn:decentraland:matic:collections-thirdparty:test-fail',
            resolver: 'test-resolver',
            metadata: {
              thirdParty: {
                name: 'Test Fail',
                description: 'Test fail description',
                contracts: [{ network: 'matic', address: '0x1' }]
              }
            }
          } as ThirdPartyProvider
        ]
        ;(mockFetch.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            synchronizationStatus: { synchronizationState: 'Syncing' }
          })
        })
        ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValueOnce(providers)
        ;(mockEntitiesFetcher.fetchCollectionEntities as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'))

        await warmer.warmCache()
      })

      it('should return status with errors', () => {
        const status = warmer.getStatus()

        expect(status.collectionsWarmed).toBe(0)
        expect(status.totalCollections).toBe(1)
        expect(status.errors).toHaveLength(1)
        expect(status.errors[0]).toContain('Fetch failed')
      })
    })
  })

  describe('when calling start', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValue([])
      ;(mockFetch.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          synchronizationStatus: { synchronizationState: 'Syncing' }
        })
      })
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    describe('and default configuration is used', () => {
      it('should log startup configuration', async () => {
        if (warmer.start) {
          await warmer.start({} as any)
        }

        expect(mockLogger.info).toHaveBeenCalledWith(
          '[start] Cache warmer starting',
          expect.objectContaining({
            warmupDelayMs: 5000,
            warmupIntervalMs: 169200000
          })
        )
      })

      it('should log successful start', async () => {
        if (warmer.start) {
          await warmer.start({} as any)
        }

        expect(mockLogger.info).toHaveBeenCalledWith('[start] Cache warmer started successfully')
      })
    })

    describe('and custom warmup timing is configured', () => {
      let warmupDelay: number
      let warmupInterval: number
      let customWarmer: ThirdPartyCollectionsCacheWarmer

      beforeEach(async () => {
        warmupDelay = 5000
        warmupInterval = 10000

        const customConfig = createConfigMock()
        ;(customConfig.getString as jest.Mock).mockResolvedValueOnce('true')
        ;(customConfig.getNumber as jest.Mock).mockImplementation((key: string) => {
          if (key === 'CACHE_WARMER_DELAY_MS') {
            return Promise.resolve(warmupDelay)
          }
          if (key === 'CACHE_WARMER_INTERVAL_MS') {
            return Promise.resolve(warmupInterval)
          }
          return Promise.resolve(undefined)
        })

        const customComponents = { ...components, config: customConfig }
        customWarmer = await createThirdPartyCollectionsCacheWarmer(customComponents)
      })

      it('should schedule initial warmup after delay', async () => {
        if (customWarmer.start) {
          await customWarmer.start({} as any)
        }

        // Fast-forward time by delay
        jest.advanceTimersByTime(warmupDelay)
        await Promise.resolve()

        expect(mockLogger.info).toHaveBeenCalledWith('[start] Starting initial cache warmup')
      })

      it('should schedule periodic warmups at configured interval', async () => {
        if (customWarmer.start) {
          await customWarmer.start({} as any)
        }

        // Fast-forward past initial delay
        jest.advanceTimersByTime(warmupDelay)
        await Promise.resolve()

        // Fast-forward by interval
        jest.advanceTimersByTime(warmupInterval)
        await Promise.resolve()

        expect(mockLogger.info).toHaveBeenCalledWith('[start] Starting periodic cache warmup')
      })
    })
  })

  describe('when calling stop', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      ;(mockThirdPartyProvidersStorage.getAll as jest.Mock).mockResolvedValue([])
      ;(mockFetch.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          synchronizationStatus: { synchronizationState: 'Syncing' }
        })
      })
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    describe('and the cache warmer was started', () => {
      beforeEach(async () => {
        if (warmer.start) {
          await warmer.start({} as any)
        }
      })

      it('should log that cache warmer is stopping', async () => {
        await warmer.stop?.()

        expect(mockLogger.info).toHaveBeenCalledWith('[stop] Stopping cache warmer')
        expect(mockLogger.info).toHaveBeenCalledWith('[stop] Cache warmer stopped')
      })

      it('should clear the interval timer', async () => {
        await warmer.stop?.()

        // Advance timers to verify no more periodic warmups happen
        jest.advanceTimersByTime(100000)
        await Promise.resolve()

        // Should not see additional periodic warmup logs after stop
        const periodicCalls = (mockLogger.info as jest.Mock).mock.calls.filter(
          (call) => call[0] === '[start] Starting periodic cache warmup'
        )
        expect(periodicCalls.length).toBe(0)
      })
    })

    describe('and the cache warmer was not started', () => {
      it('should log stop message without errors', async () => {
        await warmer.stop?.()

        expect(mockLogger.info).toHaveBeenCalledWith('[stop] Stopping cache warmer')
        expect(mockLogger.info).toHaveBeenCalledWith('[stop] Cache warmer stopped')
      })
    })
  })
})
