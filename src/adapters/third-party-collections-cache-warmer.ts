import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, ThirdPartyProvider } from '../types'

export type ThirdPartyCollectionsCacheWarmer = IBaseComponent & {
  warmCache(): Promise<void>
  getStatus(): CacheWarmerStatus
}

export type CacheWarmerStatus = {
  enabled: boolean
  lastWarmupTime?: number
  lastWarmupDuration?: number
  collectionsWarmed: number
  totalCollections: number
  errors: string[]
  isWarming: boolean
}

/**
 * Cache warmer component that pre-loads third-party collections into cache
 * on service boot and periodically refreshes them.
 *
 * This eliminates the cold-start penalty where the first user to request
 * a collection triggers expensive pagination across thousands of entities.
 */
export async function createThirdPartyCollectionsCacheWarmer(
  components: Pick<
    AppComponents,
    'config' | 'logs' | 'thirdPartyProvidersStorage' | 'entitiesFetcher' | 'fetch' | 'contentServerUrl'
  >
): Promise<ThirdPartyCollectionsCacheWarmer> {
  const { config, logs, thirdPartyProvidersStorage, entitiesFetcher, fetch, contentServerUrl } = components
  const logger = logs.getLogger('third-party-collections-cache-warmer')

  const isDisabled = (await config.getString('DISABLE_CACHE_WARMER_ENABLED'))?.toLowerCase() === 'true' || false
  const warmupIntervalMs = (await config.getNumber('CACHE_WARMER_INTERVAL_MS')) || 1000 * 60 * 60 * 47 // 47 hours (just before the LW collection 48h TTL expires)
  const warmupDelayMs = (await config.getNumber('CACHE_WARMER_DELAY_MS')) || 5000 // 5 seconds delay after boot
  const maxConcurrent = (await config.getNumber('CACHE_WARMER_MAX_CONCURRENT')) || 3 // Warm 3 collections in parallel
  const healthCheckRetryMs = (await config.getNumber('CACHE_WARMER_HEALTH_CHECK_RETRY_MS')) || 5000 // 5 seconds between retries
  const healthCheckMaxRetries = (await config.getNumber('CACHE_WARMER_HEALTH_CHECK_MAX_RETRIES')) || 60 // Max 60 retries (5 min)

  let intervalId: ReturnType<typeof setInterval> | undefined
  let isWarming = false
  const status: CacheWarmerStatus = {
    enabled: !isDisabled,
    collectionsWarmed: 0,
    totalCollections: 0,
    errors: [],
    isWarming: false
  }

  /**
   * Check if content server is ready for cache warming
   * Content server status endpoint returns synchronizationState which should be "Syncing"
   */
  async function isContentServerReady(): Promise<boolean> {
    try {
      const statusUrl = `${contentServerUrl}/status`
      logger.debug('[isContentServerReady] Checking content server health', { statusUrl })

      const response = await fetch.fetch(statusUrl)
      if (!response.ok) {
        logger.warn('[isContentServerReady] Content server status check failed', {
          status: response.status,
          statusText: response.statusText
        })
        return false
      }

      const data = await response.json()
      const syncState = data.synchronizationStatus?.synchronizationState

      logger.debug('[isContentServerReady] Content server status', {
        version: data.version,
        ethNetwork: data.ethNetwork,
        synchronizationState: syncState
      })

      // Content server is ready when synchronizationState is "Syncing"
      const isReady = syncState === 'Syncing'

      if (!isReady) {
        logger.info('[isContentServerReady] Content server not ready yet', {
          currentState: syncState,
          expectedState: 'Syncing'
        })
      } else {
        logger.info('[isContentServerReady] Content server is ready', {
          synchronizationState: syncState
        })
      }

      return isReady
    } catch (error) {
      logger.warn('[isContentServerReady] Error checking content server health', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Wait for content server to be ready before warming cache
   * Retries with exponential backoff up to maxRetries
   */
  async function waitForContentServerReady(): Promise<boolean> {
    logger.info('[waitForContentServerReady] Waiting for content server to be ready', {
      healthCheckRetryMs,
      healthCheckMaxRetries
    })

    for (let attempt = 1; attempt <= healthCheckMaxRetries; attempt++) {
      const isReady = await isContentServerReady()

      if (isReady) {
        logger.info('[waitForContentServerReady] Content server is ready', {
          attempt,
          totalWaitMs: (attempt - 1) * healthCheckRetryMs
        })
        return true
      }

      if (attempt < healthCheckMaxRetries) {
        logger.debug('[waitForContentServerReady] Retrying health check', {
          attempt,
          nextRetryInMs: healthCheckRetryMs
        })
        await new Promise((resolve) => setTimeout(resolve, healthCheckRetryMs))
      }
    }

    logger.error('[waitForContentServerReady] Content server not ready after max retries', {
      maxRetries: healthCheckMaxRetries,
      totalWaitMs: healthCheckMaxRetries * healthCheckRetryMs
    })
    return false
  }

  /**
   * Warm a single collection by fetching all its entities
   */
  async function warmCollection(provider: ThirdPartyProvider): Promise<void> {
    const collectionId = provider.id
    const providerName = provider.metadata?.thirdParty?.name || 'unknown'
    const startTime = Date.now()

    try {
      logger.info('[warmCollection] Starting cache warm', {
        collectionId,
        providerName
      })

      // Fetch all entities - this will populate the 48h cache
      const entities = await entitiesFetcher.fetchCollectionEntities(collectionId)
      const duration = Date.now() - startTime

      logger.info('[warmCollection] Collection warmed successfully', {
        collectionId,
        providerName,
        entitiesCount: entities.length,
        durationMs: duration
      })

      status.collectionsWarmed++
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      logger.error('[warmCollection] Failed to warm collection', {
        collectionId,
        providerName,
        error: errorMsg,
        durationMs: duration
      })

      status.errors.push(`${collectionId}: ${errorMsg}`)
    }
  }

  /**
   * Warm collections in batches with concurrency control
   */
  async function warmCollectionsInBatches(providers: ThirdPartyProvider[]): Promise<void> {
    const batches: ThirdPartyProvider[][] = []

    // Split providers into batches
    for (let i = 0; i < providers.length; i += maxConcurrent) {
      batches.push(providers.slice(i, i + maxConcurrent))
    }

    logger.info('[warmCollectionsInBatches] Processing batches', {
      totalProviders: providers.length,
      batchCount: batches.length,
      maxConcurrent
    })

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      logger.debug('[warmCollectionsInBatches] Processing batch', {
        batchNumber: i + 1,
        batchSize: batch.length
      })

      await Promise.all(batch.map((provider) => warmCollection(provider)))
    }
  }

  /**
   * Main cache warming function
   */
  async function warmCache(): Promise<void> {
    if (isDisabled) {
      logger.info('[warmCache] Cache warmer is disabled')
      return
    }

    if (isWarming) {
      logger.warn('[warmCache] Cache warming already in progress, skipping')
      return
    }

    isWarming = true
    status.isWarming = true
    status.errors = []
    status.collectionsWarmed = 0

    try {
      logger.info('[warmCache] Starting cache warmup')

      logger.info('[warmCache] Checking if content server is ready')
      const contentServerReady = await waitForContentServerReady()

      if (!contentServerReady) {
        const errorMsg = 'Content server not ready after waiting. Skipping cache warmup.'
        logger.error('[warmCache] ' + errorMsg)
        status.errors.push(errorMsg)
        return
      }

      logger.info('[warmCache] Content server is ready, proceeding with cache warmup')

      const allProviders = await thirdPartyProvidersStorage.getAll()

      const providersWithContracts = allProviders.filter(
        (provider) => (provider.metadata.thirdParty.contracts?.length ?? 0) > 0
      )

      status.totalCollections = providersWithContracts.length

      logger.info('[warmCache] Fetched third-party providers', {
        totalProviders: allProviders.length,
        providersWithContracts: providersWithContracts.length,
        providersWithoutContracts: allProviders.length - providersWithContracts.length
      })

      if (providersWithContracts.length === 0) {
        logger.warn('[warmCache] No providers with contracts found')
        return
      }

      await warmCollectionsInBatches(providersWithContracts)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[warmCache] Fatal error during cache warmup', {
        error: errorMsg
      })

      status.errors.push(`Fatal: ${errorMsg}`)
    } finally {
      isWarming = false
      status.isWarming = false
    }
  }

  /**
   * Get current cache warmer status
   */
  function getStatus(): CacheWarmerStatus {
    return { ...status }
  }

  /**
   * Start the cache warmer component
   */
  async function start() {
    if (isDisabled) {
      logger.info('[start] Cache warmer is disabled via config')
      return
    }

    logger.info('[start] Cache warmer starting', {
      warmupIntervalMs,
      warmupDelayMs,
      maxConcurrent
    })

    // Initial warmup after delay
    setTimeout(() => {
      logger.info('[start] Starting initial cache warmup')
      warmCache().catch((error) => {
        logger.error('[start] Initial warmup failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      })
    }, warmupDelayMs)

    // Periodic warmup
    intervalId = setInterval(() => {
      logger.info('[start] Starting periodic cache warmup')
      warmCache().catch((error) => {
        logger.error('[start] Periodic warmup failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      })
    }, warmupIntervalMs)

    logger.info('[start] Cache warmer started successfully')
  }

  /**
   * Stop the cache warmer component
   */
  async function stop() {
    logger.info('[stop] Stopping cache warmer')

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = undefined
    }

    logger.info('[stop] Cache warmer stopped')
  }

  return {
    start,
    stop,
    warmCache,
    getStatus
  }
}
