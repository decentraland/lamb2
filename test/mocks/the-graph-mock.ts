import { ISubgraphComponent } from "@well-known-components/thegraph-component"
import { TheGraphComponent } from "../../src/ports/the-graph"
import { QueryGraph } from "../../src/types"

const createMockSubgraphComponent = (mock?: QueryGraph): ISubgraphComponent => ({
  query: mock ?? (jest.fn() as jest.MockedFunction<QueryGraph>)
})

export function createTheGraphComponentMock(): TheGraphComponent {
  return {
    start: async () => { },
    stop: async () => { },
    ethereumCollectionsSubgraph: createMockSubgraphComponent(),
    maticCollectionsSubgraph: createMockSubgraphComponent(),
    ensSubgraph: createMockSubgraphComponent(),
    thirdPartyRegistrySubgraph: createMockSubgraphComponent()
  }
}