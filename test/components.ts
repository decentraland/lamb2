// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createRunner, createLocalFetchCompoment } from '@well-known-components/test-helpers'

import { main } from '../src/service'
import { TestComponents } from '../src/types'
import { initComponents as originalInitComponents } from '../src/components'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createTestMetricsComponent } from '@well-known-components/metrics'
import { metricDeclarations } from '../src/metrics'
import { createLogComponent } from '@well-known-components/logger'
import { createWearablesFetcherComponent } from '../src/adapters/wearables-fetcher'
import { createTheGraphComponentMock } from './mocks/the-graph-mock'
import { createContentComponentMock } from './mocks/content-mock'
import { createDefinitionsFetcherComponent } from '../src/adapters/definitions-fetcher'

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

async function initComponents(): Promise<TestComponents> {
  const components = await originalInitComponents()

  const config = await createDotEnvConfigComponent({}, { COMMIT_HASH: 'commit_hash' })
  const logs = await createLogComponent({})
  
  const theGraphMock = createTheGraphComponentMock()
  const contentMock = createContentComponentMock()
  const wearablesFetcher = await createWearablesFetcherComponent({ config, theGraph: theGraphMock, logs })
  const definitionsFetcher = await createDefinitionsFetcherComponent({ config, content: contentMock, logs })

  return {
    ...components,
    config: config,
    metrics: createTestMetricsComponent(metricDeclarations),
    localFetch: await createLocalFetchCompoment(config),
    theGraph: theGraphMock,
    content: contentMock,
    wearablesFetcher,
    definitionsFetcher
  }
}
