// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createRunner, createLocalFetchCompoment } from "@well-known-components/test-helpers"

import { main } from "../src/service"
import { QueryGraph, TestComponents } from "../src/types"
import { initComponents as originalInitComponents } from "../src/components"
import { EntityType } from "dcl-catalyst-commons"
import { ISubgraphComponent } from "@well-known-components/thegraph-component"
import { TheGraphComponent } from "../src/ports/the-graph"

/**
 * Behaves like Jest "describe" function, used to describe a test for a
 * use case, it creates a whole new program and components to run an
 * isolated test.
 *
 * State is persistent within the steps of the test.
 */
export const test = createRunner<TestComponents>({
  main,
  initComponents,
})

export const createMockSubgraphComponent = (mock?: QueryGraph): ISubgraphComponent => ({
  query: mock ?? (jest.fn() as jest.MockedFunction<QueryGraph>)
})

const defaultTheGraphComponent: TheGraphComponent = {
  start: async () => {},
  stop: async () => {},
  collectionsSubgraph: createMockSubgraphComponent(),
  maticCollectionsSubgraph: createMockSubgraphComponent(),
  ensSubgraph: createMockSubgraphComponent(),
  thirdPartyRegistrySubgraph: createMockSubgraphComponent()
}

// export const buildTheGraphComponent = (subGraphs?: Partial<SubGraphs>): TheGraphComponent => ({
//   ...defaultTheGraphComponent,
//   ...subGraphs
// })

async function initComponents(): Promise<TestComponents> {
  const components = await originalInitComponents()

  const { config } = components

  // components.theGraph = defaultTheGraphComponent

  return {
    ...components,
    localFetch: await createLocalFetchCompoment(config),
  }
}

