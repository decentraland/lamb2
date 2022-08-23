import { Entity } from "@dcl/schemas"
import { AppComponents } from "../../types"

/*
 * This class receives an array of Entities, it extracts the corresponding data (depending on which NFT the NFTOwnershipChecker is implemented)
 * from it and stores it into a map. Then it checks the ownership for the NFTs 
 */
export abstract class NFTOwnershipChecker {

    private ownedNFTsByAddress: Map<string, string[]>
    private components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">

    constructor(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">) {
        this.components = components
        this.ownedNFTsByAddress = new Map()
    }

    public async addNFTsFromEntities(profileEntities: Entity[]) {
        // Extract data from entities
        const nftsByAddress = new Map<string, string[]>()
        const promises = profileEntities
            .filter(hasMetadata)
            .map(async (entity) => {
                const address = entity.pointers[0]
                const nfts = await this.extractNFTsFromEntity(entity)
                nftsByAddress.set(address, nfts)
            })
        await Promise.all(promises)

        // Set ownership
        this.ownedNFTsByAddress = await this.getOwnedNFTsByAddress(this.components, nftsByAddress)
    }

    public getOwnedForAddress(address: string): string[] {
        return this.ownedNFTsByAddress.get(address) ?? []
    }

    /*
     * Determines what data corresponds to the NFTOwnershipChecker implementation and
     * how to extract it from an entity
     */
    protected abstract extractNFTsFromEntity(entity: Entity): Promise<string[]>

    /* 
     * Determines how to check the ownership for every nft resulting in a map of ownership for every eth address
     */
    protected abstract getOwnedNFTsByAddress(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">, nftIdsByAddressToCheck: Map<string, string[]>): Promise<Map<string, string[]>>
}

function hasMetadata(entity: Entity): boolean {
    return !!entity.metadata
}