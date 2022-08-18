import { Entity } from "@dcl/schemas"
import { TheGraphComponent } from "../ports/the-graph"
import { AppComponents } from "../types"

const NFT_FRAGMENTS_PER_QUERY = 10

/*
 * This class receives an array of Entities, it extracts the corresponding data (depending on which NFT the NFTOwnershipChecker is implemented)
 * from it and stores it into a map. Then it checks the ownership for the NFTs 
 */
export abstract class NFTOwnershipChecker {

    private ownedNFTsByAddress: Map<string, Set<string>>
    private components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">

    constructor(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">) {
        this.components = components
        this.ownedNFTsByAddress = new Map()
    }

    public async addNFTsFromEntities(profileEntities: Entity[]) {
        // Extract data from entities
        const nftsByAddress = new Map<string, string[]>()
        profileEntities
            .filter(hasMetadata)
            .map(async (entity) => {
                const address = entity.pointers[0]
                const nfts = this.extractNFTsFromEntity(entity)
                nftsByAddress.set(address, nfts)
            })

        // Set ownership
        this.ownedNFTsByAddress = await this.getOwnedNFTsByAddress(nftsByAddress)
    }

    public getOwnedForAddress(address: string): Set<string> {
        return this.ownedNFTsByAddress.get(address) ?? new Set()
    }

    protected abstract extractNFTsFromEntity(entity: Entity): string[]

    protected abstract querySubgraph(theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]): any

    // Checks the ownership for every nft resulting in a map of ownership for every eth address
    private async getOwnedNFTsByAddress(nftIdsByAddressToCheck: Map<string, string[]>): Promise<Map<string, Set<string>>> {
        // Check ownership for unknown nfts
        const ownedNftIdsByEthAddress = await this.querySubgraphByFragments(nftIdsByAddressToCheck)

        // Fill final map with nfts ownership
        for(const [ethAddress, nfts] of nftIdsByAddressToCheck) {
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
    private async querySubgraphByFragments(nftIdsByAddressToCheck: Map<string, string[]>): Promise<Map<string, Set<string>>> {
        const entries = Array.from(nftIdsByAddressToCheck.entries())
        const result: Map<string, Set<string>> = new Map()

        // Make multilpe queries to graph as at most NFT_FRAGMENTS_PER_QUERY per time
        let offset = 0
        while (offset < entries.length) {
            const slice = entries.slice(offset, offset + NFT_FRAGMENTS_PER_QUERY)
            try {
                const queryResult = await this.querySubgraph(this.components.theGraph, slice)
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
}

function hasMetadata(entity: Entity): boolean {
    return !!entity.metadata
}