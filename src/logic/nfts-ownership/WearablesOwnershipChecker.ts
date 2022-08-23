import { Entity } from "@dcl/schemas";
import { runQuery, TheGraphComponent } from "../../ports/the-graph";
import { AppComponents, ProfileMetadata } from "../../types";
import { NFTOwnershipChecker } from "./NFTOwnershipChecker";
import { parseUrn } from '@dcl/urn-resolver'
import { ISubgraphComponent } from "@well-known-components/thegraph-component";
import { ownedNFTsByAddress } from "../ownership";

export class WearablesOwnershipChecker extends NFTOwnershipChecker {
    constructor(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">) {
        super(components)
    }
    
    protected async extractNFTsFromEntity(entity: Entity): Promise<string[]> {
        // Get non-base wearables wearables which urn are valid 
        return await getValidNonBaseWearables(entity.metadata)
    }
    
    protected async getOwnedNFTsByAddress(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">, wearableIdsByEthAddress: Map<string, string[]>): Promise<Map<string, string[]>> {
        return ownedNFTsByAddress(components, wearableIdsByEthAddress, queryWearablesSubgraph)
    }
}

export async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<string[]> {
    const wearablesInProfile: string[] = []
    for (const avatar of metadata.avatars) {
      for (const wearableId of avatar.avatar.wearables) {
        if (!isBaseAvatar(wearableId)) {
            const translatedWearableId = await translateWearablesIdFormat(wearableId)
            if (translatedWearableId)
                wearablesInProfile.push(translatedWearableId)
        }
      }
    }
    const filteredWearables = wearablesInProfile.filter((wearableId): wearableId is string => !!wearableId)
    return filteredWearables
}

function isBaseAvatar(wearable: string): boolean {
    return wearable.includes('base-avatars')
}

// Translates from the old id format into the new one
export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
    if (!wearableId.startsWith('dcl://'))
        return wearableId
    
    const parsed = await parseUrn(wearableId)
    return parsed?.uri?.toString()
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