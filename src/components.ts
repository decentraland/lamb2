import { L1Network, L2Network } from '@dcl/catalyst-contracts'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent, IFetchComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createMetricsComponent, instrumentHttpServerWithMetrics } from '@well-known-components/metrics'
import { createContentClient } from 'dcl-catalyst-client'
import { HTTPProvider } from 'eth-connect'
import { createCatalystsFetcher } from './adapters/catalysts-fetcher'
import { createContentServerUrl } from './adapters/content-server-url'
import {
  createEmoteDefinitionsFetcherComponent,
  createWearableDefinitionsFetcherComponent
} from './adapters/definitions-fetcher'
import { createElementsFetcherComponent } from './adapters/elements-fetcher'
import { createEntitiesFetcherComponent } from './adapters/entities-fetcher'
import { createNameDenylistFetcher } from './adapters/name-denylist-fetcher'
import { createPOIsFetcher } from './adapters/pois-fetcher'
import { createRealmNameComponent } from './adapters/realm-name-validator'
import { createResourcesStatusComponent } from './adapters/resource-status'
import { createStatusComponent } from './adapters/status'
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
import { createThirdPartyProvidersGraphFetcherComponent } from './adapters/third-party-providers-graph-fetcher'
import { createThirdPartyProvidersServiceFetcherComponent } from './adapters/third-party-providers-service-fetcher'
import { createThirdPartyProvidersStorage } from './logic/third-party-providers-storage'

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
  const content = createContentClient({ url: contentServerUrl, fetcher: fetch })

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

  const thirdPartyProvidersGraphFetcher = createThirdPartyProvidersGraphFetcherComponent({ theGraph })
  const thirdPartyProvidersServiceFetcher = await createThirdPartyProvidersServiceFetcherComponent({ config, fetch })
  const thirdPartyProvidersStorage = await createThirdPartyProvidersStorage({
    logs,
    thirdPartyProvidersGraphFetcher,
    thirdPartyProvidersServiceFetcher
  })
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllThirdPartyWearables({ thirdPartyProvidersStorage, fetch, logs, entitiesFetcher }, address)
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

  const resourcesStatusCheck = createResourcesStatusComponent({ logs })
  const status = await createStatusComponent({ logs, fetch })

  const ethNetwork = (await config.getString('ETH_NETWORK')) ?? 'mainnet'
  if (!['mainnet', 'goerli'].includes(ethNetwork)) {
    throw new Error(`Invalid ETH_NETWORK ${ethNetwork}`)
  }
  const l1Network: L1Network = ethNetwork as any
  const l2Network: L2Network = l1Network === 'mainnet' ? 'polygon' : 'mumbai'
  const l1Provider = new HTTPProvider(`https://rpc.decentraland.org/${encodeURIComponent(l1Network)}?project=lamb2`, {
    fetch: fetch.fetch
  })
  const l2Provider = new HTTPProvider(`https://rpc.decentraland.org/${encodeURIComponent(l2Network)}?project=lamb2`, {
    fetch: fetch.fetch
  })
  const catalystsFetcher = await createCatalystsFetcher({ l1Provider }, l1Network)
  const poisFetcher = await createPOIsFetcher({ l2Provider }, l2Network)
  const nameDenylistFetcher = await createNameDenylistFetcher({ l1Provider }, l1Network)
  const realmName = await createRealmNameComponent({ config, catalystsFetcher, fetch, logs })

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
    thirdPartyProvidersGraphFetcher,
    thirdPartyProvidersServiceFetcher,
    thirdPartyProvidersStorage,
    contentServerUrl,
    resourcesStatusCheck,
    status,
    realmName,
    l1Provider,
    l2Provider,
    catalystsFetcher,
    poisFetcher,
    nameDenylistFetcher
  }
}
