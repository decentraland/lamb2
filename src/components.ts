import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent, IFetchComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createMetricsComponent, instrumentHttpServerWithMetrics } from '@well-known-components/metrics'
import {
  createEmoteDefinitionsFetcherComponent,
  createWearableDefinitionsFetcherComponent
} from './adapters/definitions-fetcher'
import { createElementsFetcherComponent } from './adapters/elements-fetcher'
import { createThirdPartyProvidersFetcherComponent } from './adapters/third-party-providers-fetcher'
import { createWearablesCachesComponent } from './controllers/handlers/old-wearables-handler'
import { fetchAllEmotes, fetchAllWearables } from './logic/fetch-elements/fetch-items'
import { fetchAllLANDs } from './logic/fetch-elements/fetch-lands'
import { fetchAllNames } from './logic/fetch-elements/fetch-names'
import { fetchAllThirdPartyWearables } from './logic/fetch-elements/fetch-third-party-wearables'
import { metricDeclarations } from './metrics'
import { createContentComponent } from './ports/content'
import { createFetchComponent } from './ports/fetch'
import { createOwnershipCachesComponent } from './ports/ownership-caches'
import { createTheGraphComponent, TheGraphComponent } from './ports/the-graph'
import { AppComponents, GlobalContext } from './types'
import { BaseItem, fetchAllBaseWearables, fetchAllBaseEmotes } from './logic/fetch-elements/fetch-base-items'

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
  const thirdPartyProvidersFetcher = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllThirdPartyWearables(
      { theGraph, thirdPartyProvidersFetcher, fetch, logs, wearableDefinitionsFetcher },
      address
    )
  )
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent({ config, logs, content })
  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent({ config, logs, content })
  const baseWearablesFetcher = createElementsFetcherComponent<BaseItem>({ logs }, async (_address) =>
    fetchAllBaseWearables()
  )
  const wearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllWearables({ theGraph }, address)
  )
  const baseEmotesFetcher = createElementsFetcherComponent<BaseItem>({ logs }, async (_address) => fetchAllBaseEmotes())
  const emotesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllEmotes({ theGraph }, address)
  )
  const namesFetcher = createElementsFetcherComponent({ logs }, async (address) => fetchAllNames({ theGraph }, address))
  const landsFetcher = createElementsFetcherComponent({ logs }, async (address) => fetchAllLANDs({ theGraph }, address))

  // old component for old wearable endpoint. Remove in future
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
    baseWearablesFetcher,
    wearablesFetcher,
    wearableDefinitionsFetcher,
    emoteDefinitionsFetcher,
    thirdPartyWearablesFetcher,
    baseEmotesFetcher,
    emotesFetcher,
    namesFetcher,
    landsFetcher,
    wearablesCaches,
    thirdPartyProvidersFetcher
  }
}
