import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent, IFetchComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createMetricsComponent, instrumentHttpServerWithMetrics } from '@well-known-components/metrics'
import { createContentClient } from 'dcl-catalyst-client'
import { createContentServerUrl } from './adapters/content-server-url'
import {
  createEmoteDefinitionsFetcherComponent,
  createWearableDefinitionsFetcherComponent
} from './adapters/definitions-fetcher'
import { createElementsFetcherComponent } from './adapters/elements-fetcher'
import { createEntitiesFetcherComponent } from './adapters/entities-fetcher'
import { createThirdPartyProvidersFetcherComponent } from './adapters/third-party-providers-fetcher'
import { createWearablesCachesComponent } from './controllers/handlers/old-wearables-handler'
import { fetchAllBaseWearables } from './logic/fetch-elements/fetch-base-items'
import { fetchAllEmotes, fetchAllWearables } from './logic/fetch-elements/fetch-items'
import { fetchAllLANDs } from './logic/fetch-elements/fetch-lands'
import { fetchAllNames } from './logic/fetch-elements/fetch-names'
import { fetchAllThirdPartyWearables } from './logic/fetch-elements/fetch-third-party-wearables'
import { metricDeclarations } from './metrics'
import { createFetchComponent } from './ports/fetch'
import { createOwnershipCachesComponent } from './ports/ownership-caches'
import { createTheGraphComponent, TheGraphComponent } from './ports/the-graph'
import { AppComponents, BaseWearable, GlobalContext } from './types'

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

  const contentServerUrl = await createContentServerUrl({ config })
  const content = createContentClient({ url: contentServerUrl.get(), fetcher: fetch })

  const theGraph = theGraphComponent
    ? theGraphComponent
    : await createTheGraphComponent({ config, logs, fetch, metrics })

  const ownershipCaches = await createOwnershipCachesComponent({ config })

  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })

  const entitiesFetcher = await createEntitiesFetcherComponent({ config, logs, content })

  const thirdPartyProvidersFetcher = createThirdPartyProvidersFetcherComponent({ logs, theGraph })
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllThirdPartyWearables({ thirdPartyProvidersFetcher, fetch, logs, entitiesFetcher }, address)
  )
  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })
  const baseWearablesFetcher = createElementsFetcherComponent<BaseWearable>({ logs }, async (_address) =>
    fetchAllBaseWearables({ entitiesFetcher })
  )
  const wearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllWearables({ theGraph }, address)
  )
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
    entitiesFetcher,
    thirdPartyWearablesFetcher,
    emotesFetcher,
    namesFetcher,
    landsFetcher,
    wearablesCaches,
    thirdPartyProvidersFetcher,
    contentServerUrl
  }
}
