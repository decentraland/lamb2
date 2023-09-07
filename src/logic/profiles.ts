import { AppComponents, ProfileMetadata, OnChainWearable, OnChainEmote } from '../types'
import { Avatar, Entity, Snapshots } from '@dcl/schemas'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'
import { parseUrn } from '@dcl/urn-resolver'
import { splitUrnAndTokenId } from './utils'

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

export async function getProfiles(
  components: Pick<
    AppComponents,
    | 'metrics'
    | 'content'
    | 'theGraph'
    | 'config'
    | 'fetch'
    | 'ownershipCaches'
    | 'thirdPartyProvidersStorage'
    | 'logs'
    | 'wearablesFetcher'
    | 'emotesFetcher'
  >,
  ethAddresses: string[],
  ifModifiedSinceTimestamp?: number | undefined
): Promise<ProfileMetadata[] | undefined> {
  try {
    let profileEntities: Entity[] = await components.content.fetchEntitiesByPointers(ethAddresses)

    // Avoid querying profiles if there wasn't any new deployment
    if (
      ifModifiedSinceTimestamp &&
      profileEntities.every((it) => roundToSeconds(it.timestamp) <= ifModifiedSinceTimestamp)
    ) {
      return
    }

    profileEntities = profileEntities.filter((entity) => !!entity.metadata)

    const namesOwnershipChecker = createNamesOwnershipChecker(components)
    const tpwOwnershipChecker = createTPWOwnershipChecker(components)

    // Get data from entities and add them to the ownership checkers
    await Promise.all(
      profileEntities.map(async (entity) => {
        const ethAddress = entity.pointers[0]
        const metadata: ProfileMetadata = entity.metadata
        const names = metadata.avatars
          .filter((avatar) => avatar.hasClaimedName)
          .map(({ name }) => name)
          .filter((name) => name && name.trim().length > 0)

        metadata.timestamp = entity.timestamp

        // Get non-base wearables which urn are valid
        const wearables: string[] = []
        for (const avatar of metadata.avatars) {
          for (const wearableId of avatar.avatar.wearables) {
            if (!isBaseWearable(wearableId)) {
              const translatedWearableId = await translateWearablesIdFormat(wearableId)
              if (translatedWearableId) {
                wearables.push(translatedWearableId)
              }
            }
          }
        }

        namesOwnershipChecker.addNFTsForAddress(ethAddress, names)
        tpwOwnershipChecker.addNFTsForAddress(ethAddress, wearables)
      })
    )

    // Check ownership for every nft in parallel
    await Promise.all([namesOwnershipChecker.checkNFTsOwnership(), tpwOwnershipChecker.checkNFTsOwnership()])

    // Add name data and snapshot urls to profiles
    const { config } = components
    const baseUrl = (await config.getString('CONTENT_URL')) ?? ''
    return await Promise.all(
      profileEntities.map(async (entity) => {
        const ethAddress = entity.pointers[0]
        const metadata: ProfileMetadata = entity.metadata
        const content = new Map((entity.content ?? []).map(({ file, hash }) => [file, hash]))

        // Add timestamp to the metadata
        metadata.timestamp = entity.timestamp

        // Get owned nfts from every ownership checker
        const ownedNames = namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)
        const thirdPartyWearables = tpwOwnershipChecker.getOwnedNFTsForAddress(ethAddress)

        const sanitizedAvatars = await removeNotOwnedItemsFromAvatars(components, metadata.avatars, ethAddress)

        // Fill the avatars field for each profile
        const avatars = sanitizedAvatars.map(async (sanitizedAvatar) => ({
          ...sanitizedAvatar,
          hasClaimedName: ownedNames.includes(sanitizedAvatar.name),
          avatar: {
            ...sanitizedAvatar.avatar,
            bodyShape: (await translateWearablesIdFormat(sanitizedAvatar.avatar.bodyShape)) ?? '',
            snapshots: addBaseUrlToSnapshots(baseUrl, sanitizedAvatar.avatar.snapshots, content),
            wearables: Array.from(new Set(sanitizedAvatar.avatar.wearables.concat(thirdPartyWearables))),
            emotes: sanitizedAvatar.avatar.emotes
          }
        }))

        return {
          timestamp: metadata.timestamp,
          avatars: await Promise.all(avatars)
        }
      })
    )
  } catch (error) {
    // TODO: logger
    console.log(error)
    return []
  }
}

// Dates received from If-Modified-Since headers have precisions of seconds, so we need to round
function roundToSeconds(timestamp: number) {
  return Math.floor(timestamp / 1000) * 1000
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

async function removeNotOwnedItemsFromAvatars(
  components: Pick<AppComponents, 'wearablesFetcher' | 'emotesFetcher' | 'config'>,
  avatars: Avatar[],
  owner: string
): Promise<Avatar[]> {
  const { wearablesFetcher, emotesFetcher, config } = components
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'
  const avatarsToReturn: Avatar[] = []

  const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)
  const ownedEmotes: OnChainEmote[] = await emotesFetcher.fetchOwnedElements(owner)

  for (const avatar of avatars) {
    const validatedWearables: string[] = []
    for (const wearable of avatar.avatar.wearables) {
      if (isBaseWearable(wearable)) {
        validatedWearables.push(wearable)
        continue
      }

      const { urn, tokenId } = splitUrnAndTokenId(wearable)

      const matchingOwnedWearable = ownedWearables.find(
        (ownedWearable) =>
          ownedWearable.urn === urn &&
          (!tokenId || ownedWearable.individualData.find((itemData) => itemData.tokenId === tokenId))
      )

      if (!matchingOwnedWearable) {
        continue
      }

      validatedWearables.push(
        ensureERC721
          ? `${matchingOwnedWearable.urn}:${tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId}`
          : matchingOwnedWearable.urn
      )
    }

    const validatedEmotes: { slot: number; urn: string }[] = []
    for (const emote of avatar.avatar.emotes ?? []) {
      if (!emote.urn.includes(':')) {
        validatedEmotes.push(emote)
        continue
      }

      const { urn, tokenId } = splitUrnAndTokenId(emote.urn)

      const matchingOwnedEmote = ownedEmotes.find(
        (ownedEmote) =>
          ownedEmote.urn === urn &&
          (!tokenId || ownedEmote.individualData.find((itemData) => itemData.tokenId === tokenId))
      )

      if (!matchingOwnedEmote) {
        continue
      }

      const urnToReturn = ensureERC721
        ? `${matchingOwnedEmote.urn}:${tokenId ? tokenId : matchingOwnedEmote.individualData[0].tokenId}`
        : matchingOwnedEmote.urn

      validatedEmotes.push({ urn: urnToReturn, slot: emote.slot })
    }

    avatarsToReturn.push({
      ...avatar,
      avatar: { ...avatar.avatar, wearables: validatedWearables, emotes: validatedEmotes }
    })
  }

  return avatarsToReturn
}
