import { EthAddress } from '@dcl/crypto'
import { AppComponents, ProfileData, ProfileMetadata, WearableId, Filename, Filehash, Name } from '../types'
import { Entity, EntityType, Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { ownedNames, ownedWearables } from './ownership'
import { IConfigComponent } from '@well-known-components/interfaces'
import { ownedThirdPartyWearables } from './third-party'

export async function getProfiles(components: Pick<AppComponents, "metrics" | "content" | "theGraph" | "config" | "fetch">, ethAddresses: EthAddress[], ifModifiedSinceTimestamp?: number | undefined): Promise<ProfileMetadata[] | undefined> {
    try {
        const { content } = components

        // Fetch entities by pointers
        const profileEntities: Entity[] = await content.fetchEntitiesByPointers(EntityType.PROFILE, ethAddresses)

        // Avoid querying profiles if there wasn't any new deployment
        if (noNewDeployments(ifModifiedSinceTimestamp, profileEntities))
            return

        // Group profile metadata, names, and wearables by ethAddress
        const { profileByEthAddress, namesByEthAddress, wearablesIdsByEthAddress } = await profileEntitiesToMaps(profileEntities)

        // Check which NFTs are owned
        const ownedWearableIdsByEthAddress = await ownedWearables(components, wearablesIdsByEthAddress)
        const ownedNamesByEthAddress = await ownedNames(components, namesByEthAddress)
        const ownedTPWByEthAddress = await ownedThirdPartyWearables(components, wearablesIdsByEthAddress)

        // Add name data and snapshot urls to profiles
        return await extendProfiles(components.config, profileByEthAddress, ownedNamesByEthAddress, ownedWearableIdsByEthAddress, ownedTPWByEthAddress)
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

async function profileEntitiesToMaps(profileEntities: Entity[]): Promise<{ profileByEthAddress: Map<EthAddress, ProfileData>, namesByEthAddress: Map<EthAddress, Name[]>, wearablesIdsByEthAddress  : Map<EthAddress, WearableId[]> }> {
    const profileByEthAddress: Map<EthAddress, ProfileData> = new Map()
    const wearablesIdsByEthAddress: Map<EthAddress, WearableId[]> = new Map()
    const namesByEthAddress: Map<EthAddress, Name[]> = new Map()

    // Extract data from every entity and fill the maps with it. Need .map() instead of .forEach() to be able to await for the method to set the maps
    const entityPromises = profileEntities
        .filter(hasMetadata)
        .map(async (entity) => { 
            const { ethAddress, metadata, content, names, wearables } = await extractDataFromEntity(entity)

            profileByEthAddress.set(ethAddress, { metadata, content})
            namesByEthAddress.set(ethAddress, names)
            wearablesIdsByEthAddress.set(ethAddress, wearables)
        })
    await Promise.all(entityPromises)

    return { profileByEthAddress, namesByEthAddress, wearablesIdsByEthAddress }
}

function hasMetadata(entity: Entity): boolean {
    return !!entity.metadata
}

async function extractDataFromEntity(entity: Entity): Promise<{ ethAddress: EthAddress; metadata: ProfileMetadata, content: Map<Filename, Filehash>, names: string[], wearables: WearableId[] }> {
    const ethAddress = entity.pointers[0]
    const metadata: ProfileMetadata = entity.metadata
    const content = new Map((entity.content ?? []).map(({ file, hash }) => [file, hash]))
    const filteredNames = metadata.avatars.map(({ name }) => name).filter((name) => name && name.trim().length > 0)
    
    // Add timestamp to the metadata
    metadata.timestamp = entity.timestamp

    // Get non-base wearables wearables which urn are valid 
    const nonBaseWearables = await getValidNonBaseWearables(metadata)

    return { ethAddress, metadata, content, names: filteredNames, wearables: nonBaseWearables }
}

async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<WearableId[]> {
    const wearablesInProfile: WearableId[] = []
    for (const avatar of metadata.avatars) {
      for (const wearableId of avatar.avatar.wearables) {
        if (!isBaseAvatar(wearableId)) {
            const translatedWearableId = await translateWearablesIdFormat(wearableId)
            if (translatedWearableId)
                wearablesInProfile.push(translatedWearableId)
        }
      }
    }
    const filteredWearables = wearablesInProfile.filter((wearableId): wearableId is WearableId => !!wearableId)
    return filteredWearables
}

export function isBaseAvatar(wearable: WearableId): boolean {
    return wearable.includes('base-avatars')
}

// Translates from the old id format into the new one
async function translateWearablesIdFormat(wearableId: WearableId): Promise<WearableId | undefined> {
    if (!wearableId.startsWith('dcl://'))
        return wearableId
    
    const parsed = await parseUrn(wearableId)
    return parsed?.uri?.toString()
}

async function extendProfiles(config: IConfigComponent, profileByAddress: Map<string, ProfileData>, namesByAddress: Map<string, Set<string>>, wearableIdsByAddress: Map<string, Set<string>>, TPWIdsByAddress: Map<string, string[]>): Promise<ProfileMetadata[]> {
    const baseUrl = await config.getString('CONTENT_SERVER_ADDRESS') ?? ''
    const extendedProfiles = Array.from(profileByAddress.entries()).map(async ([ethAddress, profile]) => {
        const ownedNames = namesByAddress.get(ethAddress)
        const ownedWearables = Array.from(wearableIdsByAddress.get(ethAddress) ?? [])
        const thirdPartyWearables = TPWIdsByAddress.get(ethAddress) ?? []
        const avatars = profile.metadata.avatars.map(async (profileData) => ({
            ...profileData,
            hasClaimedName: ownedNames?.has(profileData.name) ?? false,
            avatar: {
                ...profileData.avatar,
                bodyShape: await translateWearablesIdFormat(profileData.avatar.bodyShape) ?? '',
                snapshots: addBaseUrlToSnapshots(baseUrl, profileData.avatar.snapshots, profile.content),
                wearables: ownedWearables.concat(thirdPartyWearables)
            }
        }))
        return {
            timestamp: profile.metadata.timestamp,
            avatars: await Promise.all(avatars)
        }
    })
    return await Promise.all(extendedProfiles)
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
