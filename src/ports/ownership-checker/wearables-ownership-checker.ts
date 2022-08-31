import { ISubgraphComponent } from "@well-known-components/thegraph-component";
import { ownedNFTsByAddress } from "../../logic/ownership";
import { AppComponents, NFTsOwnershipChecker } from "../../types";
import { runQuery, TheGraphComponent } from "../the-graph";

export function createWearablesOwnershipChecker(cmpnnts: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "ownershipCaches">): NFTsOwnershipChecker {

    let ownedWearablesByAddress: Map<string, string[]> = new Map()
    const components = cmpnnts
    const cache = components.ownershipCaches.wearablesCache;

    function addNFTsForAddress(address: string, nfts: string[]) {
        ownedWearablesByAddress.set(address, nfts)
    }

    async function checkNFTsOwnership() {
        console.log('Checking ownership. Owned wearables map:')
        console.log(ownedWearablesByAddress)
        const nftsToCheckByAddress: Map<string, string[]> = new Map()
        const cachedOwnedNFTsByAddress: Map<string, string[]> = new Map()
        console.log('Checking the wearables cache...')
        // Check the cache before checking ownership in the blockchain
        for (const [address, nfts] of ownedWearablesByAddress.entries()) {
            if (cache.has(address)) {
                // Get a map {nft -> isOwned} for address
                const cachedOwnershipForAddress = cache.get(address)
                console.log(`Cache for ${address}:`)
                console.log(cachedOwnershipForAddress)

                // Check for every nft if it is in the cache and add them to cachedOwnedNfts or nftsToCheck
                const cachedOwnedNfts = []
                const nftsToCheck = []
                for (const nft of nfts) {
                    // If the nft is present on the map, ownership for the nft won't be checked in the blockchain.
                    if (cachedOwnershipForAddress?.has(nft)) {
                        // If the nft is owned, it will be added to the cached owned map. If not, it is ignored.
                        if (cachedOwnershipForAddress.get(nft))
                            cachedOwnedNfts.push(nft)
                    } else {
                        // Add the nft to the nftsToCheck
                        nftsToCheck.push(nft)
                    }
                }

                // Add cached nfts to the cached map
                if (cachedOwnedNfts.length > 0)
                    cachedOwnedNFTsByAddress.set(address, cachedOwnedNfts)

                // Add nfts to be checked to the map to be checked
                if (nftsToCheck.length > 0)
                    nftsToCheckByAddress.set(address, nftsToCheck)
            } else {
                console.log(`Address ${address} is not present`)
                // Since the address is not cached, add every nft for the address to the nftsToCheck
                nftsToCheckByAddress.set(address, nfts)
            }
        }

        console.log('nfts to check:')
        console.log(nftsToCheckByAddress)

        console.log('cached nfts:')
        console.log(cachedOwnedNFTsByAddress)
        
        // Check ownership for the non-cached nfts
        ownedWearablesByAddress = await ownedNFTsByAddress(components, nftsToCheckByAddress, queryWearablesSubgraph)

        console.log('owned wearables recently checked map:')
        console.log(ownedWearablesByAddress)

        console.log('Adding to the cache...')
        // Traverse the checked nfts to set the cache depending on its ownership
        for (const [address, nfts] of nftsToCheckByAddress) {
            console.log(`Adding adress: ${address}`)
            const ownedNftsForAddress = ownedWearablesByAddress.get(address)

            // Get the cached map for the address or initialize it if address is not present
            let ownershipForAddressToBeCached: Map<string, boolean>
            if (cache.has(address)) {
                console.log('Present')
                ownershipForAddressToBeCached = cache.get(address) ?? new Map()
            } else {
                console.log('Not present')
                ownershipForAddressToBeCached = new Map()
            }
            console.log('starting ownershipForAddressToBeCached:')
            console.log(ownershipForAddressToBeCached)
            
            console.log(`Filling cache with ${address} nfts...`)
            // Fill the map with the recently adquired nfts ownership
            for (const nft of nfts) {
                if (ownedNftsForAddress) {
                    console.log(`${nft} is owned: ${ownedNftsForAddress.includes(nft)}`)
                    ownershipForAddressToBeCached?.set(nft, ownedNftsForAddress.includes(nft))
                } else {
                    console.log(`${nft} is NOT owned since address isn't in the ownership map`)
                    // Address isn't in the ownership map so the nft is not owned by this address
                    ownershipForAddressToBeCached?.set(nft, false)
                }
            }

            // Set the map to the cache
            console.log(`setting in the cache for ${address}:`)
            console.log(ownershipForAddressToBeCached)
            cache.set(address, ownershipForAddressToBeCached)
        }

        console.log('Merging maps...')
        // Merge cachedOwnedNFTsByAddress (contains the nfts which ownershipwas cached) into ownedWearablesByAddress (recently checked ownnership map)
        for (const [cachedAddress, cachedNFTs] of cachedOwnedNFTsByAddress) {
            if (ownedWearablesByAddress.has(cachedAddress)) {
                const recentlyCheckedNFTs = ownedWearablesByAddress.get(cachedAddress) ?? []
                ownedWearablesByAddress.set(cachedAddress, recentlyCheckedNFTs?.concat(cachedNFTs))
            } else { 
                ownedWearablesByAddress.set(cachedAddress, cachedNFTs)
            }
        }
        console.log('Final map:')
        console.log(ownedWearablesByAddress)
    }

    function getOwnedNFTsForAddress(address: string) {
        return ownedWearablesByAddress.get(address) ?? []
    }
    
    return {
        addNFTsForAddress,
        checkNFTsOwnership,
        getOwnedNFTsForAddress
    }
}

async function queryWearablesSubgraph(theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]): Promise<{ owner: string; ownedNFTs: string[] }[]> {
    const result = await checkForWearablesOwnership(theGraph, nftsToCheck)
    return result.map(({ urns, owner }) => ({ ownedNFTs: urns, owner }))
}

/**
 * This method returns all the owners from the given wearables URNs. It looks for them first in Ethereum and then in Matic
 * @param wearableIdsToCheck pairs of ethAddress and a list of urns to check ownership
 * @returns the pairs of ethAddress and list of urns
 */
 async function checkForWearablesOwnership(theGraph: TheGraphComponent, wearableIdsToCheck: [string, string[]][]): Promise<{ owner: string; urns: string[] }[]> {
    const ethereumWearablesOwnersPromise = getOwnedWearables(wearableIdsToCheck, theGraph.collectionsSubgraph)
    const maticWearablesOwnersPromise = getOwnedWearables(wearableIdsToCheck, theGraph.maticCollectionsSubgraph)
    const [ethereumWearablesOwners, maticWearablesOwners] = await Promise.all([ethereumWearablesOwnersPromise, maticWearablesOwnersPromise])
    return concatWearables(ethereumWearablesOwners, maticWearablesOwners)
}

async function getOwnedWearables(wearableIdsToCheck: [string, string[]][], subgraph: ISubgraphComponent): Promise<{ owner: string; urns: string[] }[]> {
    try {
        return getOwnersByWearable(wearableIdsToCheck, subgraph)
    } catch (error) {
        // TheGraphClient.LOGGER.error(error)
        console.log(error)
        return []
    }
}

async function getOwnersByWearable(wearableIdsToCheck: [string, string[]][], subgraph: ISubgraphComponent): Promise<{ owner: string; urns: string[] }[]> {
    // Build query for subgraph
    const subgraphQuery = `{` + wearableIdsToCheck.map((query) => getWearablesFragment(query)).join('\n') + `}`

    // Run query
    const queryResponse = await runQuery<Map<string, {urn: string}[]>>(subgraph, subgraphQuery, {})
    
    // Transform result to array of { owner, urns }
    const result = Object.entries(queryResponse).map(([addressWithPrefix, wearables]) => ({
        owner: addressWithPrefix.substring(1),  // Remove the 'P' prefix added previously because the graph needs the fragment name to start with a letter
        urns: wearables.map((urnObj: {urn: string}) => urnObj.urn)
    }))

    return result
}

function getWearablesFragment([ethAddress, wearableIds]: [string, string[]]) {
    const urnList = wearableIds.map((wearableId) => `"${wearableId}"`).join(',')

    // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
    return `
        P${ethAddress}: nfts(where: { owner: "${ethAddress}", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [${urnList}] }, first: 1000) {
        urn
        }
    `
}

function concatWearables(ethereumWearablesOwners: { owner: string; urns: string[] }[], maticWearablesOwners: { owner: string; urns: string[] }[]) {
    const allWearables: Map<string, string[]> = new Map<string, string[]>()

    ethereumWearablesOwners.forEach((a) => {allWearables.set(a.owner, a.urns)})
    maticWearablesOwners.forEach((b) => {
      const existingUrns = allWearables.get(b.owner) ?? []
      allWearables.set(b.owner, existingUrns.concat(b.urns))
    })

    return Array.from(allWearables.entries()).map(([owner, urns]) => ({ owner, urns }))
}