// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createRunner, createLocalFetchCompoment, defaultServerConfig } from '@well-known-components/test-helpers'

import { main } from '../src/service'
import { TestComponents } from '../src/types'
import { initComponents as originalInitComponents } from '../src/components'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createTestMetricsComponent } from '@well-known-components/metrics'
import { metricDeclarations } from '../src/metrics'
import { createLogComponent } from '@well-known-components/logger'
import { createTheGraphComponentMock } from './mocks/the-graph-mock'
import { createContentComponentMock } from './mocks/content-mock'
import { createDefinitionsFetcherComponent } from '../src/adapters/definitions-fetcher'
import { createElementsFetcherComponent } from '../src/adapters/elements-fetcher'
import { fetchAllEmotes, fetchAllWearables } from '../src/logic/fetch-elements/fetch-items'
import { IFetchComponent } from '@well-known-components/http-server'
import { TheGraphComponent } from '../src/ports/the-graph'

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

export function testWithComponents(preConfigureComponents: () => { fetchComponent?: IFetchComponent, theGraphComponent?: TheGraphComponent }) {
  const preConfiguredComponents = preConfigureComponents()
  return createRunner<TestComponents>({
    main,
    initComponents: () => initComponents(preConfiguredComponents.fetchComponent, preConfiguredComponents.theGraphComponent)
  })
}

async function initComponents(fetchComponent?: IFetchComponent, theGraphComponent?: TheGraphComponent): Promise<TestComponents> {
  const defaultFetchConfig = defaultServerConfig()
  const config = await createDotEnvConfigComponent({}, { COMMIT_HASH: 'commit_hash', ...defaultFetchConfig })
  const fetch = fetchComponent ? fetchComponent : await createLocalFetchCompoment(config)
  const theGraphMock = theGraphComponent ? theGraphComponent : createTheGraphComponentMock()
  if (!theGraphComponent) {
    jest.spyOn(theGraphMock.thirdPartyRegistrySubgraph, 'query').mockResolvedValue({
      thirdParties: [
        {
          id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
          resolver: "https://decentraland-api.babydoge.com/v1"
        },
        {
          id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
          resolver: "https://api.cryptoavatars.io/"
        },
        {
          id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
          resolver: "https://wearables-api.unxd.com"
        }
      ]
    })
  }

  const components = await originalInitComponents(fetch, theGraphMock)

  const logs = await createLogComponent({})

  const contentMock = createContentComponentMock()
  const wearablesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllWearables({ theGraph: theGraphMock }, address)
  )
  const emotesFetcher = createElementsFetcherComponent({ logs }, async (address) =>
    fetchAllEmotes({ theGraph: theGraphMock }, address)
  )
  const definitionsFetcher = await createDefinitionsFetcherComponent({ config, content: contentMock, logs })

  return {
    ...components,
    config: config,
    metrics: createTestMetricsComponent(metricDeclarations),
    localFetch: await createLocalFetchCompoment(config),
    theGraph: theGraphMock,
    content: contentMock,
    wearablesFetcher,
    emotesFetcher,
    definitionsFetcher
  }
}
