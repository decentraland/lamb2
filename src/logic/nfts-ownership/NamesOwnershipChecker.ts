import { Entity } from "@dcl/schemas";
import { runQuery, TheGraphComponent } from "../../ports/the-graph";
import { AppComponents, ProfileMetadata } from "../../types";
import { NFTOwnershipChecker } from "./NFTOwnershipChecker";
import { ownedNFTsByAddress } from "../ownership";

export class NamesOwnershipChecker extends NFTOwnershipChecker {
    constructor(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">) {
        super(components)
    }
    
    protected async extractNFTsFromEntity(entity: Entity): Promise<string[]> {
        const metadata: ProfileMetadata = entity.metadata
        return metadata.avatars.map(({ name }) => name).filter((name) => name && name.trim().length > 0)
    }
    
    protected async getOwnedNFTsByAddress(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">, namesByEthAddress: Map<string, string[]>): Promise<Map<string, string[]>> {
        return ownedNFTsByAddress(components, namesByEthAddress, queryNamesSubgraph)
    }
}

async function queryNamesSubgraph(theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]): Promise<{ owner: string; ownedNFTs: string[] }[]> {
    const result = await checkForNamesOwnership(theGraph, nftsToCheck)
    return result.map(({ names, owner }) => ({ ownedNFTs: names, owner }))
}

async function checkForNamesOwnership(theGraph: TheGraphComponent, namesToCheck: [string, string[]][]): Promise<{ owner: string; names: string[] }[]> {
    // Build query for subgraph
    const subgraphQuery = `{` + namesToCheck.map((query) => getNamesFragment(query)).join('\n') + `}`

    // Run query
    const queryResponse = runQuery<Map<string, {name: string}[]>>(theGraph.ensSubgraph, subgraphQuery, {})

    // Transform result to array of owner and urns
    return Object.entries(queryResponse).map(([addressWithPrefix, names]) => ({
        owner: addressWithPrefix.substring(1),
        names: names.map((nameObj: {name: string} ) => nameObj.name)
    }))
  }

function getNamesFragment([ethAddress, names]: [string, string[]]) {
    const nameList = names.map((name) => `"${name}"`).join(',')
    // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
    return `
      P${ethAddress}: nfts(where: { owner: "${ethAddress}", category: ens, name_in: [${nameList}] }, first: 1000) {
        name
      }
    `
}

