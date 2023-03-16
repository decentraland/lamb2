import { ISubgraphComponent } from "@well-known-components/thegraph-component";
import { TheGraphComponent } from "../../src/ports/the-graph";
import { QueryGraph } from "../../src/types";

const createMockSubgraphComponent = (mock?: QueryGraph): ISubgraphComponent => ({
    query: mock ?? (jest.fn() as jest.MockedFunction<QueryGraph>)
  })

export function createTheGraphComponentMock(): TheGraphComponent {
    return {
      start: async () => {},
      stop: async () => {},
      ethereumCollectionsSubgraph: createMockSubgraphComponent(jest.fn().mockResolvedValueOnce({ nfts: [{
        urn: 'urn',
        id: 'id',
        tokenId: 'tokenId',
        category: 'category',
        transferredAt: Date.now(),
        item: {
            rarity: 'unique',
            price: 100
        }
    }]})),
      maticCollectionsSubgraph: createMockSubgraphComponent(),
      ensSubgraph: createMockSubgraphComponent(),
      thirdPartyRegistrySubgraph: createMockSubgraphComponent()
    }
  }