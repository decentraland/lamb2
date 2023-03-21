import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent, IFetchComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createFetchComponent } from './ports/fetch'
import { createMetricsComponent, instrumentHttpServerWithMetrics } from '@well-known-components/metrics'
import { AppComponents, GlobalContext } from './types'
import { metricDeclarations } from './metrics'
import { createTheGraphComponent, TheGraphComponent } from './ports/the-graph'
import { createContentComponent } from './ports/content'
import { createOwnershipCachesComponent } from './ports/ownership-caches'
import { createEmotesCachesComponent } from './ports/emotes-caches'
import { createDefinitionsFetcherComponent } from './adapters/definitions-fetcher'
import { createWearablesCachesComponent } from './controllers/handlers/old-wearables-handler'
import { createElementsFetcherComponent } from './adapters/elements-fetcher'
import {
  fetchAllEmotes,
  fetchAllLANDs,
  fetchAllNames,
  fetchAllThirdPartyWearables,
  fetchAllWearables
} from './logic/fetch-nfts'
import { createThirdPartyProvidersFetcherComponent } from './adapters/third-party-providers-fetcher'

// Initialize all the components of the app
export async function initComponents(
  fetchComponent?: IFetchComponent,
  theGraphComponent?: TheGraphComponent
): Promise<AppComponents> {
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
  const fetch = fetchComponent ? fetchComponent : await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { config })
  await instrumentHttpServerWithMetrics({ server, metrics, config })

  const content = await createContentComponent({ config })

  const theGraph = theGraphComponent
    ? theGraphComponent
    : await createTheGraphComponent({ config, logs, fetch, metrics })

  const ownershipCaches = await createOwnershipCachesComponent({ config })
  const emotesCaches = await createEmotesCachesComponent({ config })
  const thirdPartyProvidersFetcher = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllThirdPartyWearables({ theGraph, thirdPartyProvidersFetcher, fetch, logs }, address)
  )
  const definitionsFetcher = await createDefinitionsFetcherComponent({ config, logs, content })
  const wearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllWearables({ theGraph }, address)
  )
  const emotesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllEmotes({ theGraph }, address)
  )
  const namesFetcher = createElementsFetcherComponent({ logs }, async (address) => fetchAllNames({ theGraph }, address))
  const landsFetcher = createElementsFetcherComponent({ logs }, async (address) => fetchAllLANDs({ theGraph }, address))

  // old components
  const wearablesCaches = await createWearablesCachesComponent({ config })

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
    emotesFetcher,
    namesFetcher,
    landsFetcher,
    wearablesCaches,
    thirdPartyProvidersFetcher
  }
}
