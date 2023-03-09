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
import { createEmotesCachesComponent } from './ports/emotes-caches'
import { createWearablesFetcherComponent } from './adapters/wearables-fetcher'
import { createDefinitionsFetcherComponent } from './adapters/definitions-fetcher'
import { createThirdPartyWearablesFetcherComponent } from './adapters/third-party-wearables-fetcher'
import { createEmotesFetcherComponent } from './adapters/emotes-fetcher'

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

  const ownershipCaches = await createOwnershipCachesComponent({ config })
  const emotesCaches = await createEmotesCachesComponent({ config })
  const wearablesFetcher = await createWearablesFetcherComponent({ config, theGraph, logs })
  const thirdPartyWearablesFetcher = await createThirdPartyWearablesFetcherComponent({ config, logs, theGraph, fetch })
  const definitionsFetcher = await createDefinitionsFetcherComponent({ config, logs, content })
  const emotesFetcher = await createEmotesFetcherComponent({ config, theGraph, logs })

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
    emotesCaches,
    wearablesFetcher,
    definitionsFetcher,
    thirdPartyWearablesFetcher,
    emotesFetcher
  }
}
