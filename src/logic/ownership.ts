import { TheGraphComponent } from '../ports/the-graph'
import { AppComponents } from '../types'

/*
 * Checks the ownership for every nft resulting in a map of ownership for every eth address.
 * Receive a `querySubgraph` method to know how to do the query.
 */
export async function ownedNFTsByAddress(
  components: Pick<AppComponents, 'theGraph' | 'config'>,
  nftIdsByAddressToCheck: Map<string, string[]>,
  querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any
): Promise<Map<string, string[]>> {
  // Check ownership for unknown nfts
  const ownedNftIdsByEthAddress = await querySubgraphByFragments(components, nftIdsByAddressToCheck, querySubgraph)

  // Fill the final map with nfts ownership
  for (const [ethAddress, nfts] of nftIdsByAddressToCheck) {
    const ownedNfts = ownedNftIdsByEthAddress.get(ethAddress)
    // If the query to the subgraph failed, then consider the nft as owned
    if (!ownedNfts) {
      ownedNftIdsByEthAddress.set(ethAddress, nfts)
    }
  }
  return ownedNftIdsByEthAddress
}

/*
 * Return a set of the NFTs that are actually owned by the eth address, for every eth address.
 * Receive a `querySubgraph` method to know how to do the query.
 */
async function querySubgraphByFragments(
  components: Pick<AppComponents, 'theGraph' | 'config'>,
  nftIdsByAddressToCheck: Map<string, string[]>,
  querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any
): Promise<Map<string, string[]>> {
  const { theGraph, config } = components
  const nft_fragments_per_query = parseInt((await config.getString('NFT_FRAGMENTS_PER_QUERY')) ?? '10')
  const entries = Array.from(nftIdsByAddressToCheck.entries())
  const result: Map<string, string[]> = new Map()

  // Make multiple queries to graph as at most NFT_FRAGMENTS_PER_QUERY per time
  let offset = 0
  while (offset < entries.length) {
    const slice = entries.slice(offset, offset + nft_fragments_per_query)
    try {
      const queryResult = await querySubgraph(theGraph, slice)
      for (const { ownedNFTs, owner } of queryResult) {
        result.set(owner, ownedNFTs)
      }
    } catch (error) {
      // TODO: logger
      console.log(error)
    } finally {
      offset += nft_fragments_per_query
    }
  }

  return result
}
