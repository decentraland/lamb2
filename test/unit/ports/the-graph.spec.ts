import { createSubgraphComponent } from '@dcl/thegraph-component'
import { createTheGraphComponent } from '../../../src/ports/the-graph'

jest.mock('@dcl/thegraph-component', () => ({ createSubgraphComponent: jest.fn() }))

const PROVIDER = 'https://subgraph.decentraland.org'

function configWith(values: Record<string, string | undefined>) {
  return { getString: jest.fn(async (key: string) => values[key]), getNumber: jest.fn(async () => undefined) } as any
}

/** The URLs handed to the subgraph component, in the order the port creates them. */
function urlsCreated(): string[] {
  return (createSubgraphComponent as jest.Mock).mock.calls.map(([, url]) => url)
}

describe('when creating the subgraph components', () => {
  let components: any

  beforeEach(() => {
    ;(createSubgraphComponent as jest.Mock).mockImplementation(async (_components, url) => ({ query: jest.fn(), url }))
    components = { logs: { getLogger: () => ({}) }, fetch: {}, metrics: {} }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the realm runs on sepolia without explicit subgraph URLs', () => {
    beforeEach(async () => {
      await createTheGraphComponent({ ...components, config: configWith({ ETH_NETWORK: 'sepolia' }) })
    })

    it('should resolve every subgraph through the provider, including the L1 collections and the names ones', () => {
      expect(urlsCreated()).toEqual([
        `${PROVIDER}/collections-ethereum-sepolia`,
        `${PROVIDER}/collections-matic-amoy`,
        `${PROVIDER}/marketplace-sepolia`,
        `${PROVIDER}/tpr-matic-amoy`,
        `${PROVIDER}/land-manager-sepolia`
      ])
    })
  })

  describe('and the realm runs on mainnet without explicit subgraph URLs', () => {
    beforeEach(async () => {
      await createTheGraphComponent({ ...components, config: configWith({ ETH_NETWORK: 'mainnet' }) })
    })

    it('should resolve every subgraph through the provider at its mainnet path', () => {
      expect(urlsCreated()).toEqual([
        `${PROVIDER}/collections-ethereum-mainnet`,
        `${PROVIDER}/collections-matic-mainnet`,
        `${PROVIDER}/marketplace`,
        `${PROVIDER}/tpr-matic-mainnet`,
        `${PROVIDER}/land-manager`
      ])
    })
  })

  describe('and explicit subgraph URLs are configured', () => {
    beforeEach(async () => {
      await createTheGraphComponent({
        ...components,
        config: configWith({
          ETH_NETWORK: 'sepolia',
          COLLECTIONS_L1_SUBGRAPH_URL: 'https://example.com/l1',
          COLLECTIONS_L2_SUBGRAPH_URL: 'https://example.com/l2',
          ENS_OWNER_PROVIDER_URL: 'https://example.com/ens',
          THIRD_PARTY_REGISTRY_SUBGRAPH_URL: 'https://example.com/tpr',
          LAND_SUBGRAPH_URL: 'https://example.com/land'
        })
      })
    })

    it('should use them over the defaults', () => {
      expect(urlsCreated()).toEqual([
        'https://example.com/l1',
        'https://example.com/l2',
        'https://example.com/ens',
        'https://example.com/tpr',
        'https://example.com/land'
      ])
    })
  })
})
