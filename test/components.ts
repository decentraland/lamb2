// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createLocalFetchCompoment, createRunner, defaultServerConfig } from '@well-known-components/test-helpers'

import { createConfigComponent } from '@well-known-components/env-config-provider'
import { IConfigComponent, IFetchComponent } from '@well-known-components/interfaces'
import { createLogComponent } from '@well-known-components/logger'
import { createTestMetricsComponent } from '@well-known-components/metrics'
import { initComponents as originalInitComponents } from '../src/components'
import {
  createEmoteDefinitionsFetcherComponent,
  createWearableDefinitionsFetcherComponent
} from '../src/adapters/definitions-fetcher'
import {
  createElementsFetcherComponent,
  createPaginatedElementsFetcherComponent
} from '../src/adapters/elements-fetcher'
import { createEntitiesFetcherComponent } from '../src/adapters/entities-fetcher'
import { fetchAllEmotes, fetchAllWearables } from '../src/logic/fetch-elements/fetch-items'
import {
  fetchAllWearablesWithFallback,
  fetchWearablesPaginatedWithFallback,
  fetchAllEmotesWithFallback,
  fetchEmotesPaginatedWithFallback
} from '../src/logic/fetch-elements/fetch-items-with-fallback'
import { fetchAllThirdPartyWearables } from '../src/logic/fetch-elements/fetch-third-party-wearables'
import { metricDeclarations } from '../src/metrics'
import { TheGraphComponent } from '../src/ports/the-graph'
import { main } from '../src/service'
import { TestComponents } from '../src/types'
import { createContentClientMock } from './mocks/content-mock'
import { createTheGraphComponentMock } from './mocks/the-graph-mock'
import { createAlchemyNftFetcherMock } from './mocks/alchemy-mock'
import { createMarketplaceApiMock } from './mocks/marketplace-api-fetcher-mock'

/**
 * Behaves like Jest "describe" function, used to describe a test for a
 * use case, it creates a whole new program and components to run an
 * isolated test.
 *
 * State is persistent within the steps of the test.
 */
export const test = createRunner<TestComponents>({
  main,
  initComponents
})

export function testWithComponents(
  preConfigureComponents: () => {
    fetchComponent?: IFetchComponent
    theGraphComponent?: TheGraphComponent
    config?: IConfigComponent
  }
) {
  const preConfiguredComponents = preConfigureComponents()
  return createRunner<TestComponents>({
    main,
    initComponents: () =>
      initComponents(
        preConfiguredComponents.fetchComponent,
        preConfiguredComponents.theGraphComponent,
        preConfiguredComponents.config
      )
  })
}

async function initComponents(
  fetchComponent?: IFetchComponent,
  theGraphComponent?: TheGraphComponent,
  mockConfig?: IConfigComponent
): Promise<TestComponents> {
  const defaultFetchConfig = defaultServerConfig()
  const config =
    mockConfig ??
    createConfigComponent({
      ...defaultFetchConfig,
      CONTENT_URL: 'https://peer.decentraland.org/content',
      PROFILE_CDN_BASE_URL: 'https://peer.decentraland.org/content',
      LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
      ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
      MARKETPLACE_API_URL: 'https://marketplace-api.decentraland.org',
      COMMIT_HASH: 'commit_hash',
      CURRENT_VERSION: 'version',
      HTTP_SERVER_PORT: '7272'
    })
  const fetch = fetchComponent ? fetchComponent : await createLocalFetchCompoment(config)
  const theGraphMock = theGraphComponent ? theGraphComponent : createTheGraphComponentMock()
  if (!theGraphComponent) {
    jest.spyOn(theGraphMock.thirdPartyRegistrySubgraph, 'query').mockResolvedValue({
      thirdParties: [
        {
          id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
          resolver: 'https://decentraland-api.babydoge.com/v1',
          metadata: {}
        },
        {
          id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars',
          resolver: 'https://api.cryptoavatars.io/',
          metadata: {}
        },
        {
          id: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip',
          resolver: 'https://wearables-api.unxd.com',
          metadata: {}
        }
      ]
    })
  }

  const components = await originalInitComponents(fetch, theGraphMock)

  const logs = await createLogComponent({})

  const content = createContentClientMock()
  const marketplaceApiFetcher = createMarketplaceApiMock()

  const wearablesFetcher = createPaginatedElementsFetcherComponent(
    { logs },
    async (address) => fetchAllWearablesWithFallback({ theGraph: theGraphMock, marketplaceApiFetcher, logs }, address),
    async (address, limit, offset) =>
      fetchWearablesPaginatedWithFallback(
        { theGraph: theGraphMock, marketplaceApiFetcher, logs },
        address,
        limit,
        offset
      )
  )
  const emotesFetcher = createPaginatedElementsFetcherComponent(
    { logs },
    async (address) => fetchAllEmotesWithFallback({ theGraph: theGraphMock, marketplaceApiFetcher, logs }, address),
    async (address, limit, offset) =>
      fetchEmotesPaginatedWithFallback({ theGraph: theGraphMock, marketplaceApiFetcher, logs }, address, limit, offset)
  )

  const entitiesFetcher = await createEntitiesFetcherComponent({ config, logs, content })

  const contentServerUrl = 'baseUrl'

  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })
  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent({
    config,
    logs,
    content,
    contentServerUrl
  })

  const alchemyNftFetcher = createAlchemyNftFetcherMock()
  const metrics = createTestMetricsComponent(metricDeclarations)
  const thirdPartyWearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllThirdPartyWearables(
      {
        metrics,
        contentServerUrl,
        alchemyNftFetcher,
        thirdPartyProvidersStorage: components.thirdPartyProvidersStorage,
        fetch,
        logs,
        entitiesFetcher
      },
      address
    )
  )

  return {
    ...components,
    alchemyNftFetcher,
    config,
    metrics,
    localFetch: await createLocalFetchCompoment(config),
    theGraph: theGraphMock,
    content,
    contentServerUrl,
    wearablesFetcher,
    entitiesFetcher,
    emotesFetcher,
    wearableDefinitionsFetcher,
    emoteDefinitionsFetcher,
    thirdPartyWearablesFetcher,
    marketplaceApiFetcher
  }
}
