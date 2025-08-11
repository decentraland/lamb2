// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createLocalFetchCompoment, createRunner, defaultServerConfig } from '@well-known-components/test-helpers'

import { createConfigComponent } from '@well-known-components/env-config-provider'
import { IConfigComponent, IFetchComponent } from '@well-known-components/interfaces'
import { createLogComponent } from '@well-known-components/logger'
import { createTestMetricsComponent } from '@well-known-components/metrics'
import {
  createEmoteDefinitionsFetcherComponent,
  createWearableDefinitionsFetcherComponent
} from '../src/adapters/definitions-fetcher'
import { createElementsFetcherComponent } from '../src/adapters/elements-fetcher'
import { createEntitiesFetcherComponent } from '../src/adapters/entities-fetcher'
import { initComponents as originalInitComponents } from '../src/components'
import { fetchEmotes, fetchWearables } from '../src/logic/fetch-elements/fetch-items'
import { fetchNames } from '../src/logic/fetch-elements/fetch-names'
import { fetchAllThirdPartyWearables } from '../src/logic/fetch-elements/fetch-third-party-wearables'
import { metricDeclarations } from '../src/metrics'
import { TheGraphComponent } from '../src/ports/the-graph'
import { main } from '../src/service'
import { TestComponents, ThirdPartyWearable } from '../src/types'
import { createContentClientMock } from './mocks/content-mock'
import { createTheGraphComponentMock } from './mocks/the-graph-mock'
import { createAlchemyNftFetcherMock } from './mocks/alchemy-mock'
import { createMarketplaceApiFetcherMock } from './mocks/marketplace-api-mock'

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
    marketplaceApiFetcher?: any
    noMarketplaceApi?: boolean
  }
) {
  const preConfiguredComponents = preConfigureComponents()
  return createRunner<TestComponents>({
    main,
    initComponents: () =>
      initComponents(
        preConfiguredComponents.fetchComponent,
        preConfiguredComponents.theGraphComponent,
        preConfiguredComponents.config,
        preConfiguredComponents.marketplaceApiFetcher,
        preConfiguredComponents.noMarketplaceApi
      )
  })
}

async function initComponents(
  fetchComponent?: IFetchComponent,
  theGraphComponent?: TheGraphComponent,
  mockConfig?: IConfigComponent,
  preConfiguredMarketplaceApiFetcher?: any,
  noMarketplaceApi?: boolean
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
      COMMIT_HASH: 'commit_hash',
      CURRENT_VERSION: 'version',
      HTTP_SERVER_PORT: '7272',
      MARKETPLACE_API_URL: 'https://marketplace-api-test.com' // Enable marketplace API for tests
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

  // Create marketplace API fetcher for tests (use mock by default, can be overridden in individual tests)
  // If noMarketplaceApi flag is true, don't provide marketplace API (use The Graph directly)
  const marketplaceApiFetcher = noMarketplaceApi
    ? undefined
    : preConfiguredMarketplaceApiFetcher || createMarketplaceApiFetcherMock()

  const content = createContentClientMock()
  const wearablesFetcher = createElementsFetcherComponent(
    { logs, theGraph: theGraphMock, marketplaceApiFetcher },
    fetchWearables
  )
  const emotesFetcher = createElementsFetcherComponent(
    { logs, theGraph: theGraphMock, marketplaceApiFetcher },
    fetchEmotes
  )
  const namesFetcher = createElementsFetcherComponent(
    { logs, theGraph: theGraphMock, marketplaceApiFetcher },
    fetchNames
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
  const thirdPartyWearablesFetcher = createElementsFetcherComponent<ThirdPartyWearable>(
    { logs, theGraph: theGraphMock, marketplaceApiFetcher },
    async (_deps, address) => {
      const thirdPartyWearables = await fetchAllThirdPartyWearables(
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
      return {
        elements: thirdPartyWearables,
        totalAmount: thirdPartyWearables.length
      }
    }
  )

  const result: any = {
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
    namesFetcher,
    wearableDefinitionsFetcher,
    emoteDefinitionsFetcher,
    thirdPartyWearablesFetcher
  }

  // Only add marketplace API fetcher if it's not undefined
  if (marketplaceApiFetcher) {
    result.marketplaceApiFetcher = marketplaceApiFetcher
  }

  return result
}
