import { AppComponents, ProfileData, ProfileMetadata, WearableId, Filename, Filehash, Name } from '../types'
import { Entity, EntityType, Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { IConfigComponent } from '@well-known-components/interfaces'
import { translateWearablesIdFormat, WearablesOwnershipChecker } from './nfts-ownership/WearablesOwnershipChecker'
import { NamesOwnershipChecker } from './nfts-ownership/NamesOwnershipChecker'
import { TPWOwnershipChecker } from './nfts-ownership/TPWOwnershipChecker'

export async function getProfiles(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">, ethAddresses: string[], ifModifiedSinceTimestamp?: number | undefined): Promise<ProfileMetadata[] | undefined> {
    try {
        // Fetch entities by pointers
        const profileEntities: Entity[] = await components.content.fetchEntitiesByPointers(EntityType.PROFILE, ethAddresses) // COULD BE CACHED?

        // Avoid querying profiles if there wasn't any new deployment
        if (noNewDeployments(ifModifiedSinceTimestamp, profileEntities))
            return

        // Get data from entities and add them to the ownership checkers
        // await addNFTsToCheckersFromEntities

        const wearablesOwnershipChecker = new WearablesOwnershipChecker(components) // Could be a component if we want to use it as a cache
        await wearablesOwnershipChecker.addNFTsFromEntities(profileEntities)
        const namesOwnershipChecker = new NamesOwnershipChecker(components) // Could be a component if we want to use it as a cache
        await namesOwnershipChecker.addNFTsFromEntities(profileEntities)
        const tpwOwnershipChecker = new TPWOwnershipChecker(components) // Could be a component if we want to use it as a cache
        await tpwOwnershipChecker.addNFTsFromEntities(profileEntities)

        // Add name data and snapshot urls to profiles
        return await extendProfiles(components.config, profileEntities, wearablesOwnershipChecker, namesOwnershipChecker, tpwOwnershipChecker)
    } catch(error) {
        console.log(error)
        return []
    }
}

function noNewDeployments(ifModifiedSinceTimestamp: number | undefined, entities: Entity[]) {
    return ifModifiedSinceTimestamp &&
        entities.every((it) => roundToSeconds(it.timestamp) <= ifModifiedSinceTimestamp)
}

// Dates received from If-Modified-Since headers have precisions of seconds, so we need to round
function roundToSeconds(timestamp: number) {
    return Math.floor(timestamp / 1000) * 1000
}

// async function addNFTsToCheckersFromEntities(profileEntities: Entity[]): Promise<{ profileByEthAddress: Map<string, ProfileData>, namesByEthAddress: Map<string, string[]>, wearablesIdsByEthAddress  : Map<string, string[]> }> {
//     const profileByEthAddress: Map<string, ProfileData> = new Map()
//     const wearablesIdsByEthAddress: Map<string, string[]> = new Map()
//     const namesByEthAddress: Map<string, Name[]> = new Map()

//     // Extract data from every entity and fill the maps with it. Need .map() instead of .forEach() to be able to await for the method to set the maps
//     const entityPromises = profileEntities
//         .filter(hasMetadata)
//         .map(async (entity) => { 
//             const { ethAddress, metadata, content, names, wearables } = await extractDataFromEntity(entity)

//             profileByEthAddress.set(ethAddress, { metadata, content})
//             namesByEthAddress.set(ethAddress, names)
//             wearablesIdsByEthAddress.set(ethAddress, wearables)
//         })
//     await Promise.all(entityPromises)

//     return { profileByEthAddress, namesByEthAddress, wearablesIdsByEthAddress }
// }

async function extendProfiles(config: IConfigComponent, profileEntities: Entity[], wearablesOwnershipChecker: WearablesOwnershipChecker, namesOwnershipChecker: NamesOwnershipChecker, tpwOwnershipChecker: TPWOwnershipChecker): Promise<ProfileMetadata[]> {
    const baseUrl = await config.getString('CONTENT_SERVER_ADDRESS') ?? ''
    const extendedProfiles = profileEntities
        .filter(hasMetadata)
        .map(async (entity) => {
            const { ethAddress, metadata, content } = await extractProfileDataFromEntity(entity)
            const ownedNames = namesOwnershipChecker.getOwnedForAddress(ethAddress)
            const ownedWearables = wearablesOwnershipChecker.getOwnedForAddress(ethAddress)
            const thirdPartyWearables = tpwOwnershipChecker.getOwnedForAddress(ethAddress)
            const avatars = metadata.avatars.map(async (profileData) => ({
                ...profileData,
                hasClaimedName: ownedNames.includes(profileData.name),
                avatar: {
                    ...profileData.avatar,
                    bodyShape: await translateWearablesIdFormat(profileData.avatar.bodyShape) ?? '',
                    snapshots: addBaseUrlToSnapshots(baseUrl, profileData.avatar.snapshots, content),
                    wearables: ownedWearables.concat(thirdPartyWearables)
                }
            }))
            return {
                timestamp: metadata.timestamp,
                avatars: await Promise.all(avatars)
            }
        })
    return await Promise.all(extendedProfiles)
}

function hasMetadata(entity: Entity): boolean {
    return !!entity.metadata
}

async function extractProfileDataFromEntity(entity: Entity): Promise<{ ethAddress: string; metadata: ProfileMetadata, content: Map<Filename, Filehash>}> {
    const ethAddress = entity.pointers[0]
    const metadata: ProfileMetadata = entity.metadata
    const content = new Map((entity.content ?? []).map(({ file, hash }) => [file, hash]))
    
    // Add timestamp to the metadata
    metadata.timestamp = entity.timestamp

    return { ethAddress, metadata, content }
}

/**
 * The content server provides the snapshots' hashes, but clients expect a full url. So in this
 * method, we replace the hashes by urls that would trigger the snapshot download.
 */
function addBaseUrlToSnapshots(baseUrl: string, snapshots: Snapshots, content: Map<string, string>): Snapshots {
    snapshots.body = addBaseUrlToSnapshot(baseUrl, snapshots.body, content)
    snapshots.face256 = addBaseUrlToSnapshot(baseUrl, snapshots.face256, content)
    return snapshots
}

function addBaseUrlToSnapshot(baseUrl: string, snapshot: string, content: Map<string, string>): string {
    if (content.has(snapshot)) {
        // Snapshot references a content file
        const hash = content.get(snapshot)!
        return baseUrl + `/contents/${hash}`
      } else {
        // Snapshot is directly a hash
        return baseUrl + `/contents/${snapshot}`
      }
}
