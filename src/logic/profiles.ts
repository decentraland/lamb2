import { AppComponents, ProfileMetadata, Filename, Filehash, NFTsOwnershipChecker } from '../types'
import { Entity, Snapshots } from '@dcl/schemas'
import { IConfigComponent } from '@well-known-components/interfaces'
import { createWearablesOwnershipChecker } from '../ports/ownership-checker/wearables-ownership-checker'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'
import { parseUrn } from '@dcl/urn-resolver'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { TheGraphComponent, runQuery } from '../ports/the-graph'

// Map to store the urns and tokenIds by owner
const resultMap = new Map<string, Map<string, string>>()

export async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<string[]> {
  const wearablesInProfile: string[] = []
  for (const avatar of metadata.avatars) {
    for (const wearableId of avatar.avatar.wearables) {
      if (!isBaseWearable(wearableId)) {
        const translatedWearableId = await translateWearablesIdFormat(wearableId)
        if (translatedWearableId) {
          wearablesInProfile.push(translatedWearableId)
        }
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
  if (!wearableId.startsWith('dcl://')) {
    return wearableId
  }

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
    if (translatedWearableId) {
      validBaseWearables.push(translatedWearableId)
    }
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

    // Extract the eth addresses and wearables from the entities
    const nftsToCheckByAddress = extractEthAddressAndWearables(profileEntities)

    // Query the subgraph for the wearables to get the urns and tokenIds
    await queryWearablesSubgraph(components.theGraph, nftsToCheckByAddress)

    // Avoid querying profiles if there wasn't any new deployment
    if (noNewDeployments(ifModifiedSinceTimestamp, profileEntities)) {
      return
    }

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
    let ownedWearables = wearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)
    const thirdPartyWearables = tpwOwnershipChecker.getOwnedNFTsForAddress(ethAddress)

    // Extend the urns with the tokenIds for the wearables that are older than [timestamp]
    if (isOlderThan(entity.timestamp)) {
      const ethAddressMap = resultMap.get(ethAddress)
      if (ethAddressMap) {
        ownedWearables = ownedWearables.map((urn) => {
          const extendedUrn = urn + ':' + ethAddressMap.get(urn)
          return extendedUrn ? extendedUrn : urn
        })
      }
    }

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

async function queryWearablesSubgraph(theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) {
  try {
    const result = await getWearablesOwnersByNetwork(nftsToCheck, theGraph)

    result.forEach(({ urns, owner }) => {
      const urnMap = new Map<string, string>()
      urns.forEach(({ urn, tokenId }) => {
        urnMap.set(urn, tokenId)
      })
      resultMap.set(owner, urnMap)
    })
  } catch (error) {
    console.log(error)
  }
}

async function getWearablesOwnersByNetwork(
  wearableIdsToCheck: [string, string[]][],
  subgraph: TheGraphComponent
): Promise<{ owner: string; urns: { urn: string; tokenId: string }[] }[]> {
  const { ethereum, matic } = splitWearablesByNetwork(wearableIdsToCheck)

  const networkPromises = [
    getOwnedWearables(ethereum, subgraph.ethereumCollectionsSubgraph),
    getOwnedWearables(matic, subgraph.maticCollectionsSubgraph)
  ]

  return Promise.all(networkPromises).then(([ethereumWearablesOwners, maticWearablesOwners]) =>
    concatWearables(ethereumWearablesOwners, maticWearablesOwners)
  )
}

async function getOwnedWearables(
  wearableIdsToCheck: [string, string[]][],
  subgraph: ISubgraphComponent
): Promise<{ owner: string; urns: { urn: string; tokenId: string }[] }[]> {
  // Build query for subgraph
  const filtered = wearableIdsToCheck.filter(([, urns]) => urns.length > 0)
  if (filtered.length > 0) {
    const subgraphQuery = `{` + filtered.map((query) => getWearablesUrnsAndTokenIds(query)).join('\n') + `}`
    // Run query
    const queryResponse = await runQuery<Map<string, { urn: string; tokenId: string }[]>>(subgraph, subgraphQuery, {})
    // Transform the result to an array of { owner, urns: { urn, tokenId} }
    return Object.entries(queryResponse).map(([addressWithPrefix, wearables]) => ({
      owner: addressWithPrefix.substring(1), // Remove the 'P' prefix added previously
      urns: wearables.map((urnObj: { urn: string; tokenId: string }) => ({
        urn: urnObj.urn,
        tokenId: urnObj.tokenId
      }))
    }))
  }

  return wearableIdsToCheck.map(([owner]) => ({ owner, urns: [] }))
}

function getWearablesUrnsAndTokenIds([ethAddress, wearableIds]: [string, string[]]) {
  const urnList = wearableIds.map((wearableId) => `"${wearableId}"`).join(',')

  // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
  return `
        P${ethAddress}: nfts(where: { owner: "${ethAddress}", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [${urnList}] }, first: 1000) {
        urn,
        tokenId
        }
    `
}

function extractEthAddressAndWearables(data: Entity[]): [string, string[]][] {
  return data
    .filter((item: Entity) => {
      // Extract the timestamp from the entity
      const entityTimestamp = item.timestamp

      // Check if the entity's timestamp is older than [timestamp]
      return isOlderThan(entityTimestamp)
    })
    .map((item: Entity) => {
      const ethAddress = item.metadata?.avatars[0].ethAddress
      const wearables = item.metadata?.avatars[0].avatar.wearables
      return [ethAddress, wearables]
    })
}

function splitWearablesByNetwork(wearableIdsToCheck: [string, string[]][]) {
  const ethereum: [string, string[]][] = []
  const matic: [string, string[]][] = []

  for (const [owner, urns] of wearableIdsToCheck) {
    const ethUrns = urns.filter((urn) => urn.startsWith('urn:decentraland:ethereum'))
    if (ethUrns.length > 0) {
      ethereum.push([owner, ethUrns])
    }
    const maticUrns = urns.filter(
      // TODO Juli: check this
      (urn) => urn.startsWith('urn:decentraland:matic') || urn.startsWith('urn:decentraland:mumbai')
    )

    if (maticUrns.length > 0) {
      matic.push([owner, maticUrns])
    }
  }

  return { ethereum, matic }
}

function concatWearables(
  ethereumWearablesOwners: { owner: string; urns: { urn: string; tokenId: string }[] }[],
  maticWearablesOwners: { owner: string; urns: { urn: string; tokenId: string }[] }[]
) {
  const allWearables: Map<string, { urn: string; tokenId: string }[]> = new Map()

  ;[...ethereumWearablesOwners, ...maticWearablesOwners].forEach(({ owner, urns }) => {
    const existingUrns = allWearables.get(owner) ?? []
    allWearables.set(owner, existingUrns.concat(urns))
  })

  return Array.from(allWearables.entries()).map(([owner, urns]) => ({ owner, urns }))
}

function isOlderThan(timestamp: number) {
  const timestampDate = new Date(timestamp)
  const constantDate = new Date(1691405986) // Yesterday

  return timestampDate < constantDate
}
