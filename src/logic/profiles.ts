import { AppComponents, ProfileMetadata, Filename, Filehash, NFTsOwnershipChecker } from '../types'
import { Entity, Snapshots } from '@dcl/schemas'
import { IConfigComponent } from '@well-known-components/interfaces'
import { createWearablesOwnershipChecker } from '../ports/ownership-checker/wearables-ownership-checker'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'
import { parseUrn } from '@dcl/urn-resolver'

export async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<string[]> {
  const wearablesInProfile: string[] = []
  for (const avatar of metadata.avatars) {
    for (const wearableId of avatar.avatar.wearables) {
      if (!isBaseWearable(wearableId)) {
        const translatedWearableId = await translateWearablesIdFormat(wearableId)
        if (translatedWearableId) wearablesInProfile.push(translatedWearableId)
      }
    }
  }
  const filteredWearables = wearablesInProfile.filter((wearableId): wearableId is string => !!wearableId)
  return filteredWearables
}

function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}

export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
  if (!wearableId.startsWith('dcl://')) return wearableId

  const parsed = await parseUrn(wearableId)
  return parsed?.uri?.toString()
}

export async function getBaseWearables(wearables: string[]): Promise<string[]> {
  // Filter base wearables
  const baseWearables = wearables.filter(isBaseWearable)

  // Translate old format ones to the new id format
  const validBaseWearables = []
  for (const wearableId of baseWearables) {
    const translatedWearableId = await translateWearablesIdFormat(wearableId)
    if (translatedWearableId) validBaseWearables.push(translatedWearableId)
  }

  return validBaseWearables
}

export async function getProfiles(
  components: Pick<
    AppComponents,
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches' | 'thirdPartyProvidersStorage' | 'logs'
  >,
  ethAddresses: string[],
  ifModifiedSinceTimestamp?: number | undefined
): Promise<ProfileMetadata[] | undefined> {
  try {
    // Fetch entities by pointers
    let profileEntities: Entity[] = await components.content.fetchEntitiesByPointers(ethAddresses)

    // Avoid querying profiles if there wasn't any new deployment
    if (noNewDeployments(ifModifiedSinceTimestamp, profileEntities)) return

    // Filter entities
    profileEntities = profileEntities.filter(hasMetadata)

    // Create the NFTs ownership checkers
    const wearablesOwnershipChecker = createWearablesOwnershipChecker(components)
    const namesOwnershipChecker = createNamesOwnershipChecker(components)
    const tpwOwnershipChecker = createTPWOwnershipChecker(components)

    // Get data from entities and add them to the ownership checkers
    await addNFTsToCheckersFromEntities(
      profileEntities,
      wearablesOwnershipChecker,
      namesOwnershipChecker,
      tpwOwnershipChecker
    )

    // Check ownership for every nft in parallel
    await Promise.all([
      wearablesOwnershipChecker.checkNFTsOwnership(),
      namesOwnershipChecker.checkNFTsOwnership(),
      tpwOwnershipChecker.checkNFTsOwnership()
    ])

    // Add name data and snapshot urls to profiles
    return await extendProfiles(
      components.config,
      profileEntities,
      wearablesOwnershipChecker,
      namesOwnershipChecker,
      tpwOwnershipChecker
    )
  } catch (error) {
    // TODO: logger
    console.log(error)
    return []
  }
}

function noNewDeployments(ifModifiedSinceTimestamp: number | undefined, entities: Entity[]) {
  return ifModifiedSinceTimestamp && entities.every((it) => roundToSeconds(it.timestamp) <= ifModifiedSinceTimestamp)
}

// Dates received from If-Modified-Since headers have precisions of seconds, so we need to round
function roundToSeconds(timestamp: number) {
  return Math.floor(timestamp / 1000) * 1000
}

// Extract data from every entity and fills the nfts ownership checkers
async function addNFTsToCheckersFromEntities(
  profileEntities: Entity[],
  wearablesOwnershipChecker: NFTsOwnershipChecker,
  namesOwnershipChecker: NFTsOwnershipChecker,
  tpwOwnershipChecker: NFTsOwnershipChecker
): Promise<void> {
  const entityPromises = profileEntities.map(async (entity) => {
    const { ethAddress, names, wearables } = await extractDataFromEntity(entity)
    wearablesOwnershipChecker.addNFTsForAddress(ethAddress, wearables)
    namesOwnershipChecker.addNFTsForAddress(ethAddress, names)
    tpwOwnershipChecker.addNFTsForAddress(ethAddress, wearables)
  })
  await Promise.all(entityPromises)
}

async function extractDataFromEntity(entity: Entity): Promise<{
  ethAddress: string
  metadata: ProfileMetadata
  content: Map<Filename, Filehash>
  names: string[]
  wearables: string[]
}> {
  const ethAddress = entity.pointers[0]
  const metadata: ProfileMetadata = entity.metadata
  const content = new Map((entity.content ?? []).map(({ file, hash }) => [file, hash]))
  const filteredNames = metadata.avatars
    .filter((avatar) => avatar.hasClaimedName)
    .map(({ name }) => name)
    .filter((name) => name && name.trim().length > 0)

  // Add timestamp to the metadata
  metadata.timestamp = entity.timestamp

  // Get non-base wearables which urn are valid
  const nonBaseWearables = await getValidNonBaseWearables(metadata)

  return { ethAddress, metadata, content, names: filteredNames, wearables: nonBaseWearables }
}

async function extendProfiles(
  config: IConfigComponent,
  profileEntities: Entity[],
  wearablesOwnershipChecker: NFTsOwnershipChecker,
  namesOwnershipChecker: NFTsOwnershipChecker,
  tpwOwnershipChecker: NFTsOwnershipChecker
): Promise<ProfileMetadata[]> {
  const baseUrl = (await config.getString('CONTENT_URL')) ?? ''
  const extendedProfiles = profileEntities.map(async (entity) => {
    // Extract data from each entity, which is used to fill the final response
    const { ethAddress, metadata, content } = await extractProfileDataFromEntity(entity)

    // Get owned nfts from every ownership checker
    const ownedNames = namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)
    const ownedWearables = wearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)
    const thirdPartyWearables = tpwOwnershipChecker.getOwnedNFTsForAddress(ethAddress)

    // Fill the avatars field for each profile
    const avatars = metadata.avatars.map(async (profileData) => ({
      ...profileData,
      hasClaimedName: ownedNames.includes(profileData.name),
      avatar: {
        ...profileData.avatar,
        bodyShape: (await translateWearablesIdFormat(profileData.avatar.bodyShape)) ?? '',
        snapshots: addBaseUrlToSnapshots(baseUrl, profileData.avatar.snapshots, content),
        wearables: Array.from(
          new Set(
            (await getBaseWearables(profileData.avatar.wearables)).concat(ownedWearables).concat(thirdPartyWearables)
          )
        )
      }
    }))

    // Build each profile with timestamp and avatars
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

async function extractProfileDataFromEntity(
  entity: Entity
): Promise<{ ethAddress: string; metadata: ProfileMetadata; content: Map<Filename, Filehash> }> {
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
  const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  if (content.has(snapshot)) {
    // Snapshot references a content file
    const hash = content.get(snapshot)!
    return cleanedBaseUrl + `contents/${hash}`
  } else {
    // Snapshot is directly a hash
    return cleanedBaseUrl + `contents/${snapshot}`
  }
}
