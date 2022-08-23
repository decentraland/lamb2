import { EthAddress } from '@dcl/crypto'
import { TheGraphComponent } from '../ports/the-graph'
import { AppComponents } from '../types'

const NFT_FRAGMENTS_PER_QUERY = 10

/*
 * Checks the ownership for every nft resulting in a map of ownership for every eth address
 */
export async function ownedNFTsByAddress(components: Pick<AppComponents, "theGraph">, nftIdsByAddressToCheck: Map<string, string[]>, querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any): Promise<Map<string, string[]>> {
    const { theGraph } = components

    // Check ownership for unknown nfts
    const ownedNftIdsByEthAddress = await querySubgraphByFragments(theGraph, nftIdsByAddressToCheck, querySubgraph)

    // Fill final map with nfts ownership
    for(const [ethAddress, nfts] of nftIdsByAddressToCheck) {
        const ownedNfts = ownedNftIdsByEthAddress.get(ethAddress)
        // If the query to the subgraph failed, then consider the nft as owned
        if (!ownedNfts)
            ownedNftIdsByEthAddress.set(ethAddress, nfts)
    }
    return ownedNftIdsByEthAddress
}

/**
 * Return a set of the NFTs that are actually owned by the eth address, for every eth address.
 * Receives a `querySubgraph` method to know how to do the query.
 */ 
async function querySubgraphByFragments(theGraph: TheGraphComponent, nftIdsByAddressToCheck: Map<string, string[]>, querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any): Promise<Map<string, string[]>> {
    const entries = Array.from(nftIdsByAddressToCheck.entries())
    const result: Map<string, string[]> = new Map()

    // Make multilpe queries to graph as at most NFT_FRAGMENTS_PER_QUERY per time
    let offset = 0
    while (offset < entries.length) {
        const slice = entries.slice(offset, offset + NFT_FRAGMENTS_PER_QUERY)
        try {
            const queryResult = await querySubgraph(theGraph, slice)
            for (const { ownedNFTs, owner } of queryResult) {
                result.set(owner, ownedNFTs) 
            }
        } catch (error) {
            console.log(error)
        } finally {
            offset += NFT_FRAGMENTS_PER_QUERY
        }
    }

    return result
}
