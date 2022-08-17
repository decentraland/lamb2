import { EthAddress } from '@dcl/crypto'
import { TheGraphComponent } from '../ports/the-graph'
import { AppComponents, Name, WearableId } from '../types'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { parseUrn } from '@dcl/urn-resolver'

type Owned = boolean
type NFTId = string
const NFT_FRAGMENTS_PER_QUERY = 10

export async function ownedWearables(components: Pick<AppComponents, "theGraph">, wearableIdsByEthAddress: Map<EthAddress, WearableId[]>): Promise<Map<EthAddress, Set<WearableId>>> {
    return ownedNFTsByAddress(components, wearableIdsByEthAddress, queryWearablesSubgraph)
}

export async function ownedNames(components: Pick<AppComponents, "theGraph">, namesByEthAddress: Map<EthAddress, Name[]>): Promise<Map<EthAddress, Set<WearableId>>> {
    return ownedNFTsByAddress(components, namesByEthAddress, queryNamesSubgraph)
}

// Checks the ownership for every nft resulting in a map of ownership for every eth address
async function ownedNFTsByAddress(components: Pick<AppComponents, "theGraph">, nftIdsByEthAddressToCheck: Map<EthAddress, NFTId[]>, querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [EthAddress, string[]][]) => any): Promise<Map<EthAddress, Set<NFTId>>> {
    const { theGraph } = components

    // Check ownership for unknown nfts
    const ownedNftIdsByEthAddress = await getOwnedNftIdsByEthAddress(theGraph, nftIdsByEthAddressToCheck, querySubgraph)

    // Fill final map with nfts ownership
    for( const [ethAddress, nfts] of nftIdsByEthAddressToCheck ) {
        const ownedNfts = ownedNftIdsByEthAddress.get(ethAddress)
        // If the query to the subgraph failed, then consider the nft as owned
        if (!ownedNfts)
            ownedNftIdsByEthAddress.set(ethAddress, new Set(nfts))
    }
    return ownedNftIdsByEthAddress
}
/**
 * Return a set of the NFTs that are actually owned by the eth address, for every eth address
 */ 
async function getOwnedNftIdsByEthAddress(theGraph: TheGraphComponent, nftsToCheck: Map<EthAddress, NFTId[]>, querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [EthAddress, string[]][]) => any): Promise<Map<EthAddress, Set<NFTId>>> {
    const entries = Array.from(nftsToCheck.entries())
    const result: Map<EthAddress, Set<NFTId>> = new Map()

    // Make multilpe queries to graph as at most NFT_FRAGMENTS_PER_QUERY per time
    let offset = 0
    while (offset < entries.length) {
        const slice = entries.slice(offset, offset + NFT_FRAGMENTS_PER_QUERY)
        try {
            const queryResult = await querySubgraph(theGraph, slice)
            for (const { ownedNFTs, owner } of queryResult)
                result.set(owner, new Set(ownedNFTs))
        } catch (error) {
            console.log(error)
        } finally {
            offset += NFT_FRAGMENTS_PER_QUERY
        }
    }

    return result
}

async function queryWearablesSubgraph(theGraph: TheGraphComponent, nftsToCheck: [EthAddress, string[]][]): Promise<{ owner: string; ownedNFTs: string[] }[]> {
    const result = await checkForWearablesOwnership(theGraph, nftsToCheck)
    return result.map(({ urns, owner }) => ({ ownedNFTs: urns, owner }))
}

/**
 * This method returns all the owners from the given wearables URNs. It looks for them first in Ethereum and then in Matic
 * @param wearableIdsToCheck pairs of ethAddress and a list of urns to check ownership
 * @returns the pairs of ethAddress and list of urns
 */
async function checkForWearablesOwnership(theGraph: TheGraphComponent, wearableIdsToCheck: [EthAddress, string[]][]): Promise<{ owner: EthAddress; urns: string[] }[]> {
    const ethereumWearablesOwnersPromise = getOwnedWearables(wearableIdsToCheck, theGraph.collectionsSubgraph)
    const maticWearablesOwnersPromise = getOwnedWearables(wearableIdsToCheck, theGraph.maticCollectionsSubgraph)
    const [ethereumWearablesOwners, maticWearablesOwners] = await Promise.all([ethereumWearablesOwnersPromise, maticWearablesOwnersPromise])
    return concatWearables(ethereumWearablesOwners, maticWearablesOwners)
}

async function getOwnedWearables(wearableIdsToCheck: [EthAddress, WearableId[]][], subgraph: ISubgraphComponent): Promise<{ owner: EthAddress; urns: string[] }[]> {
    try {
        return getOwnersByWearable(wearableIdsToCheck, subgraph)
    } catch (error) {
        // TheGraphClient.LOGGER.error(error)
        console.log(error)
        return []
    }
}

async function getOwnersByWearable(wearableIdsToCheck: [EthAddress, WearableId[]][], subgraph: ISubgraphComponent): Promise<{ owner: EthAddress; urns: string[] }[]> {
    // Build query for subgraph
    const subgraphQuery = `{` + wearableIdsToCheck.map((query) => getWearablesFragment(query)).join('\n') + `}`

    // Run query
    const queryResponse = await runQuery<Map<EthAddress, {urn: string}[]>>(subgraph, subgraphQuery, {})
    
    // Transform result to array of { owner, urns }
    const result = Object.entries(queryResponse).map(([addressWithPrefix, wearables]) => ({
        owner: addressWithPrefix.substring(1),  // Remove the 'P' prefix added previously because the graph needs the fragment name to start with a letter
        urns: wearables.map((urnObj: {urn: string}) => urnObj.urn)
    }))

    return result
}

function getWearablesFragment([ethAddress, wearableIds]: [EthAddress, WearableId[]]) {
    const urnList = wearableIds.map((wearableId) => `"${wearableId}"`).join(',')

    // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
    return `
        P${ethAddress}: nfts(where: { owner: "${ethAddress}", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [${urnList}] }, first: 1000) {
        urn
        }
    `
}

export async function runQuery<QueryResult>(subgraph: ISubgraphComponent, query: string, variables: Record<string, any>): Promise<QueryResult> { // TODO: change the output type
    try {
        return subgraph.query<QueryResult>(query, variables)
    } catch (error) {
        // TheGraphClient.LOGGER.error(
        //   `Failed to execute the following query to the subgraph ${this.urls[query.subgraph]} ${query.description}'.`,
        //   error
        // )
        console.log(error)
        throw new Error('Internal server error')
    }
}

function concatWearables(ethereumWearablesOwners: { owner: EthAddress; urns: string[] }[], maticWearablesOwners: { owner: EthAddress; urns: string[] }[]) {
    const allWearables: Map<string, string[]> = new Map<string, string[]>()

    ethereumWearablesOwners.forEach((a) => {allWearables.set(a.owner, a.urns)})
    maticWearablesOwners.forEach((b) => {
      const existingUrns = allWearables.get(b.owner) ?? []
      allWearables.set(b.owner, existingUrns.concat(b.urns))
    })

    return Array.from(allWearables.entries()).map(([owner, urns]) => ({ owner, urns }))
}

async function queryNamesSubgraph(theGraph: TheGraphComponent, nftsToCheck: [EthAddress, Name[]][]): Promise<{ owner: string; ownedNFTs: string[] }[]> {
    const result = await checkForNamesOwnership(theGraph, nftsToCheck)
    return result.map(({ names, owner }) => ({ ownedNFTs: names, owner }))
}

async function checkForNamesOwnership(theGraph: TheGraphComponent, namesToCheck: [EthAddress, string[]][]): Promise<{ owner: EthAddress; names: string[] }[]> {
    // Build query for subgraph
    const subgraphQuery = `{` + namesToCheck.map((query) => getNamesFragment(query)).join('\n') + `}`

    // Run query
    const queryResponse = runQuery<Map<EthAddress, {name: string}[]>>(theGraph.ensSubgraph, subgraphQuery, {})

    // Transform result to array of owner and urns
    return Object.entries(queryResponse).map(([addressWithPrefix, names]) => ({
        owner: addressWithPrefix.substring(1),
        names: names.map((nameObj: {name: string} ) => nameObj.name)
    }))
  }

function getNamesFragment([ethAddress, names]: [EthAddress, string[]]) {
    const nameList = names.map((name) => `"${name}"`).join(',')
    // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
    return `
      P${ethAddress}: nfts(where: { owner: "${ethAddress}", category: ens, name_in: [${nameList}] }, first: 1000) {
        name
      }
    `
}
