import { createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import sinon from "sinon"
import { ownedNFTsByAddress } from "../../src/logic/ownership"
import { createTheGraphComponentMock } from "../mocks/the-graph-mock"


describe("ownership unit tests", () => {
  it("ownedNFTsByAddress must return an empty map when receives an empty map", async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '10' })
    }
    const nftIdsByAddressToCheck = new Map()
    const querySubgraph = sinon.stub()
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(0)
    expect(querySubgraph.called).toBe(false)
  })

  it("ownedNFTsByAddress must return a map with the address but no owned nfts", async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '10' })
    }
    const nftIdsByAddressToCheck = new Map([
      ['address', ['nft']]
    ])
    const querySubgraph = sinon.stub().withArgs(components.theGraph, [['address', []]]).resolves([{
      owner: 'address',
      ownedNFTs: []
    }])
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(1)
    expect(result.has('address'))
    expect(result.get('address')).toEqual([])
    expect(querySubgraph.calledOnce).toBe(true)
  })

  it("ownedNFTsByAddress must return a map with the addresses and their owned nfts", async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '10' })
    }
    const nftIdsByAddressToCheck = new Map([
      ['0x1', ['nft1', 'nft2']],
      ['0x2', ['nft3', 'nft4']]
    ])
    const querySubgraph = sinon.stub().withArgs(sinon.match.any, sinon.match.any).resolves([
      {
        owner: '0x1',
        ownedNFTs: ['nft1', 'nft2']
      },
      {
        owner: '0x2',
        ownedNFTs: ['nft3', 'nft4']
      }
    ])
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(2)
    expect(result.has('0x1'))
    expect(result.get('0x1')).toEqual(['nft1', 'nft2'])
    expect(result.has('0x2'))
    expect(result.get('0x2')).toEqual(['nft3', 'nft4'])
    expect(querySubgraph.calledOnce).toBe(true)
    sinon.assert.calledOnceWithExactly(querySubgraph, components.theGraph, [['0x1', ['nft1', 'nft2']], ['0x2', ['nft3', 'nft4']]])
  })

  it("ownedNFTsByAddress must return a map with the addresses and some of the nfts not owned", async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '10' })
    }
    const nftIdsByAddressToCheck = new Map([
      ['0x1', ['nft1', 'nft2']],
      ['0x2', ['nft3', 'nft4']]
    ])
    const querySubgraph = sinon.stub().withArgs(sinon.match.any, sinon.match.any).resolves([
      {
        owner: '0x1',
        ownedNFTs: ['nft2']
      },
      {
        owner: '0x2',
        ownedNFTs: ['nft3']
      }
    ])
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(2)
    expect(result.has('0x1'))
    expect(result.get('0x1')).toEqual(['nft2'])
    expect(result.has('0x2'))
    expect(result.get('0x2')).toEqual(['nft3'])
    expect(querySubgraph.calledOnce).toBe(true)
    sinon.assert.calledOnceWithExactly(querySubgraph, components.theGraph, [['0x1', ['nft1', 'nft2']], ['0x2', ['nft3', 'nft4']]])
  })

  it("ownedNFTsByAddress must return a map with the addresses and their owned nfts, with multiple subgraph calls", async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '1' })
    }
    const nftIdsByAddressToCheck = new Map([
      ['0x1', ['nft1', 'nft2']],
      ['0x2', ['nft1', 'nft2']],
      ['0x3', ['nft1', 'nft2']]
    ])
    const querySubgraph = sinon.stub()
    querySubgraph.withArgs(components.theGraph, [['0x1', ['nft1', 'nft2']]]).resolves([
      {
        owner: '0x1',
        ownedNFTs: ['nft1', 'nft2']
      }
    ])
    querySubgraph.withArgs(components.theGraph, [['0x2', ['nft1', 'nft2']]]).resolves([
      {
        owner: '0x2',
        ownedNFTs: ['nft1', 'nft2']
      }
    ])
    querySubgraph.withArgs(components.theGraph, [['0x3', ['nft1', 'nft2']]]).resolves([
      {
        owner: '0x3',
        ownedNFTs: ['nft1', 'nft2']
      }
    ])
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(3)
    expect(result.has('0x1'))
    expect(result.get('0x1')).toEqual(['nft1', 'nft2'])
    expect(result.has('0x2'))
    expect(result.get('0x2')).toEqual(['nft1', 'nft2'])
    expect(result.has('0x3'))
    expect(result.get('0x3')).toEqual(['nft1', 'nft2'])
    sinon.assert.calledThrice(querySubgraph)
    sinon.assert.calledWithExactly(querySubgraph, components.theGraph, [['0x1', ['nft1', 'nft2']]])
    sinon.assert.calledWithExactly(querySubgraph, components.theGraph, [['0x2', ['nft1', 'nft2']]])
    sinon.assert.calledWithExactly(querySubgraph, components.theGraph, [['0x3', ['nft1', 'nft2']]])
  })

  it('ownedNFTsByAddress must consider the nfts as owned if the query to subgraph fails', async () => {
    const components = {
      theGraph: createTheGraphComponentMock(),
      config: await createDotEnvConfigComponent({}, { NFT_FRAGMENTS_PER_QUERY: '10' })
    }
    const nftIdsByAddressToCheck = new Map([
      ['0x1', ['nft1', 'nft2']],
      ['0x2', ['nft1', 'nft2']]
    ])
    const querySubgraph = sinon.stub()
    querySubgraph.withArgs(components.theGraph, [['0x1', ['nft1', 'nft2']], ['0x2', ['nft1', 'nft2']]]).resolves([
      {
        owner: '0x2',
        ownedNFTs: ['nft1']
      }
    ])
    const result = await ownedNFTsByAddress(components, nftIdsByAddressToCheck, querySubgraph)
    expect(result.size).toEqual(2)
    expect(result.has('0x1'))
    expect(result.get('0x1')).toEqual(['nft1', 'nft2'])
    expect(result.has('0x2'))
    expect(result.get('0x2')).toEqual(['nft1'])
    sinon.assert.calledOnce(querySubgraph)
    sinon.assert.calledOnceWithExactly(querySubgraph, components.theGraph, [['0x1', ['nft1', 'nft2']], ['0x2', ['nft1', 'nft2']]])
  })
})
