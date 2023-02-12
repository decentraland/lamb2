import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createFetchComponent } from './ports/fetch'
import { createMetricsComponent, instrumentHttpServerWithMetrics } from '@well-known-components/metrics'
import { AppComponents, GlobalContext } from './types'
import { metricDeclarations } from './metrics'
import { createTheGraphComponent } from './ports/the-graph'
import { createContentComponent } from './ports/content'
import { createOwnershipCachesComponent } from './ports/ownership-caches'
import { createWearablesCachesComponent } from './ports/wearables-caches'
import { createEmotesCachesComponent } from './ports/emotes-caches'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const logs = await createLogComponent({})
  const server = await createServerComponent<GlobalContext>(
    { config, logs },
    {
      cors: {
        maxAge: 36000
      }
    }
  )
  const statusChecks = await createStatusCheckComponent({ server, config })
  const fetch = await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { config })
  await instrumentHttpServerWithMetrics({ server, metrics, config })

  const content = await createContentComponent({ config })

  const theGraph = await createTheGraphComponent({ config, logs, fetch, metrics })

  // This component contains caches for ownership checking
  const ownershipCaches = await createOwnershipCachesComponent({ config })

  // This component contains caches for wearables checking
  const wearablesCaches = await createWearablesCachesComponent({ config })

  // This component contains caches for emotes checking
  const emotesCaches = await createEmotesCachesComponent({ config })

  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics,
    content,
    theGraph,
    ownershipCaches,
    wearablesCaches,
    emotesCaches
  }
}
