import { l1Contracts, L1Network, L2Network } from '@dcl/catalyst-contracts'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import {
  createServerComponent,
  createStatusCheckComponent,
  instrumentHttpServerWithPromClientRegistry
} from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createMetricsComponent } from '@well-known-components/metrics'
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
import { createMarketplaceApiFetcher } from './adapters/marketplace-api-fetcher'
import { createNameDenylistFetcher } from './adapters/name-denylist-fetcher'
import { createPOIsFetcher } from './adapters/pois-fetcher'
import { createResourcesStatusComponent } from './adapters/resource-status'
import { createStatusComponent } from './adapters/status'
import { fetchAllBaseWearables } from './logic/fetch-elements/fetch-base-items'
import {
  fetchWearablesWithFallback,
  fetchEmotesWithFallback,
  fetchAllWearablesForProfile,
  fetchAllEmotesForProfile
} from './logic/fetch-elements/fetch-items-with-fallback'
import { fetchAllLANDs } from './logic/fetch-elements/fetch-lands'
import { fetchNamesWithFallback, fetchAllNamesForProfile } from './logic/fetch-elements/fetch-names-with-fallback'
import { fetchAllThirdPartyWearables } from './logic/fetch-elements/fetch-third-party-wearables'
import { metricDeclarations } from './metrics'
import { createFetchComponent } from './ports/fetch'
import { createOwnershipCachesComponent } from './ports/ownership-caches'
import { createTheGraphComponent, TheGraphComponent } from './ports/the-graph'
import { AppComponents, BaseWearable, GlobalContext } from './types'
import { createThirdPartyProvidersGraphFetcherComponent } from './adapters/third-party-providers-graph-fetcher'
import { createThirdPartyProvidersStorage } from './logic/third-party-providers-storage'
import { createProfilesComponent } from './adapters/profiles'
import { IFetchComponent } from '@well-known-components/interfaces'
import { createAlchemyNftFetcher } from './adapters/alchemy-nft-fetcher'
import { createThirdPartyContractRegistry } from './ports/ownership-checker/third-party-contract-registry'
import { createThirdPartyItemChecker } from './ports/ownership-checker/third-party-item-checker'
import { createParcelRightsComponent } from './adapters/parcel-rights-fetcher'

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
  await instrumentHttpServerWithPromClientRegistry({ server, metrics, config, registry: metrics.registry! })

  const contentServerUrl = await createContentServerUrl({ config })
  const content = createContentClient({ url: contentServerUrl, fetcher: fetch })

  const theGraph = theGraphComponent
    ? theGraphComponent
    : await createTheGraphComponent({ config, logs, fetch, metrics })

  const marketplaceApiFetcher = await createMarketplaceApiFetcher({ fetch, config, logs })

  const ownershipCaches = await createOwnershipCachesComponent({ config })

  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })

  const entitiesFetcher = await createEntitiesFetcherComponent({ config, logs, content })

  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })
  const baseWearablesFetcher = createElementsFetcherComponent<BaseWearable>({ logs }, async (_address) => {
    const result = await fetchAllBaseWearables({ entitiesFetcher })
    return { elements: result, totalAmount: result.length }
  })

  const wearablesFetcher = createElementsFetcherComponent(
    { logs },
    (address, limit, offset) =>
      fetchWearablesWithFallback({ theGraph, marketplaceApiFetcher, logs }, address, limit, offset),
    (address) => fetchAllWearablesForProfile({ theGraph, marketplaceApiFetcher, logs }, address)
  )

  const emotesFetcher = createElementsFetcherComponent(
    { logs },
    (address, limit, offset) =>
      fetchEmotesWithFallback({ theGraph, marketplaceApiFetcher, logs }, address, limit, offset),
    (address) => fetchAllEmotesForProfile({ theGraph, marketplaceApiFetcher, logs }, address)
  )

  const namesFetcher = createElementsFetcherComponent(
    { logs },
    (address, limit, offset) =>
      fetchNamesWithFallback({ theGraph, marketplaceApiFetcher, logs }, address, limit, offset),
    (address) => fetchAllNamesForProfile({ theGraph, marketplaceApiFetcher, logs }, address)
  )

  const landsFetcher = createElementsFetcherComponent({ logs }, async (address) => {
    const result = await fetchAllLANDs({ theGraph }, address)
    return { elements: result, totalAmount: result.length }
  })

  const resourcesStatusCheck = createResourcesStatusComponent({ logs })
  const status = await createStatusComponent({ logs, fetch })

  const l1Network: L1Network = ((await config.getString('ETH_NETWORK')) ?? 'mainnet') as L1Network
  const contracts = l1Contracts[l1Network]
  if (!contracts) {
    throw new Error(`Invalid ETH_NETWORK ${l1Network}`)
  }
  const l2Network: L2Network = l1Network === 'mainnet' ? 'polygon' : 'amoy'
  const l1Provider = new HTTPProvider(`https://rpc.decentraland.org/${encodeURIComponent(l1Network)}?project=lamb2`, {
    fetch: fetch.fetch
  })
  const l2Provider = new HTTPProvider(`https://rpc.decentraland.org/${encodeURIComponent(l2Network)}?project=lamb2`, {
    fetch: fetch.fetch
  })
  const catalystsFetcher = await createCatalystsFetcher({ l1Provider }, l1Network)
  const poisFetcher = await createPOIsFetcher({ l2Provider }, l2Network)
  const nameDenylistFetcher = await createNameDenylistFetcher({ l1Provider }, l1Network)
  const parcelRightsFetcher = await createParcelRightsComponent(
    {
      logs,
      theGraph
    },
    l1Network
  )

  const l1ThirdPartyContractRegistry = await createThirdPartyContractRegistry(logs, l1Provider, l1Network as any, '.')
  const l2ThirdPartyContractRegistry = await createThirdPartyContractRegistry(logs, l2Provider, l2Network as any, '.')
  const l1ThirdPartyItemChecker = await createThirdPartyItemChecker(
    { entitiesFetcher, logs },
    l1Provider,
    l1ThirdPartyContractRegistry
  )
  const l2ThirdPartyItemChecker = await createThirdPartyItemChecker(
    { entitiesFetcher, logs },
    l2Provider,
    l2ThirdPartyContractRegistry
  )

  const thirdPartyProvidersGraphFetcher = createThirdPartyProvidersGraphFetcherComponent({ theGraph })
  const thirdPartyProvidersStorage = await createThirdPartyProvidersStorage({
    logs,
    thirdPartyProvidersGraphFetcher
  })
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) => {
    const result = await fetchAllThirdPartyWearables(
      { alchemyNftFetcher, contentServerUrl, thirdPartyProvidersStorage, fetch, logs, entitiesFetcher, metrics },
      address
    )
    return { elements: result, totalAmount: result.length }
  })

  const alchemyNftFetcher = await createAlchemyNftFetcher({ config, logs, fetch })

  const profiles = await createProfilesComponent({
    alchemyNftFetcher,
    metrics,
    content,
    contentServerUrl,
    entitiesFetcher,
    theGraph,
    config,
    fetch,
    ownershipCaches,
    thirdPartyProvidersStorage,
    logs,
    wearablesFetcher,
    emotesFetcher,
    namesFetcher,
    l1ThirdPartyItemChecker,
    l2ThirdPartyItemChecker
  })

  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics,
    content,
    theGraph,
    marketplaceApiFetcher,
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
    parcelRightsFetcher,
    thirdPartyProvidersGraphFetcher,
    thirdPartyProvidersStorage,
    contentServerUrl,
    resourcesStatusCheck,
    status,
    l1Provider,
    l2Provider,
    catalystsFetcher,
    poisFetcher,
    nameDenylistFetcher,
    profiles,
    alchemyNftFetcher,
    l1ThirdPartyItemChecker,
    l2ThirdPartyItemChecker
  }
}
