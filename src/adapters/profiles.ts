import { AppComponents, ProfileMetadata } from '../types'
import { Avatar, Entity, Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { splitUrnAndTokenId } from '../logic/utils'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'

function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}

function isBaseEmote(emoteUrn: string): boolean {
  return emoteUrn.includes('urn:decentraland:off-chain:base-emotes')
}

export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
  if (!wearableId.startsWith('dcl://')) {
    return wearableId
  }

  const parsed = await parseUrn(wearableId)
  return parsed?.uri?.toString()
}

// Dates received from If-Modified-Since headers have precisions of seconds, so we need to round
function roundToSeconds(timestamp: number) {
  return Math.floor(timestamp / 1000) * 1000
}

/**
 * The content server provides the snapshots' hashes, but clients expect a full url. So in this
 * method, we replace the hashes by urls that would trigger the snapshot download.
 */
function addBaseUrlToSnapshots(entityId: string, baseUrl: string): Snapshots {
  return {
    body: addBaseUrlToSnapshot(entityId, baseUrl, 'body'),
    face256: addBaseUrlToSnapshot(entityId, baseUrl, 'face')
  }
}

function addBaseUrlToSnapshot(entityId: string, baseUrl: string, which: string): string {
  const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  return cleanedBaseUrl + `entities/${entityId}/${which}.png`
}
export type IProfilesComponent = {
  getProfiles(
    ethAddresses: string[],
    ifModifiedSinceTimestamp?: number | undefined
  ): Promise<ProfileMetadata[] | undefined>

  getProfile(ethAddresses: string): Promise<ProfileMetadata | undefined>
}

export async function createProfilesComponent(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'metrics'
    | 'content'
    | 'contentServerUrl'
    | 'entitiesFetcher'
    | 'theGraph'
    | 'config'
    | 'fetch'
    | 'ownershipCaches'
    | 'l1ThirdPartyItemChecker'
    | 'l2ThirdPartyItemChecker'
    | 'thirdPartyProvidersStorage'
    | 'logs'
    | 'wearablesFetcher'
    | 'emotesFetcher'
    | 'namesFetcher'
  >
): Promise<IProfilesComponent> {
  const { content, wearablesFetcher, emotesFetcher, namesFetcher, config, logs } = components
  const logger = logs.getLogger('profiles')

  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) !== 'false'
  const baseUrl = (await config.getString('PROFILE_CDN_BASE_URL')) ?? 'https://profile-images.decentraland.org'

  async function getProfiles(
    ethAddresses: string[],
    ifModifiedSinceTimestamp?: number | undefined
  ): Promise<ProfileMetadata[] | undefined> {
    try {
      let profileEntities: Entity[] = await content.fetchEntitiesByPointers(ethAddresses)

      // Avoid querying profiles if there wasn't any new deployment
      if (
        ifModifiedSinceTimestamp &&
        profileEntities.every((it) => roundToSeconds(it.timestamp) <= ifModifiedSinceTimestamp)
      ) {
        return
      }

      profileEntities = profileEntities.filter((entity) => !!entity.metadata)
      const thirdPartyWearablesOwnershipChecker = createTPWOwnershipChecker(components)

      return await Promise.all(
        profileEntities.map(async (entity) => {
          const ethAddress = entity.pointers[0]
          const isDefaultProfile: boolean = ethAddress.startsWith('default')
          const metadata: ProfileMetadata = entity.metadata

          metadata.timestamp = entity.timestamp

          const names: string[] = []
          const wearables: string[] = []
          for (const { hasClaimedName, avatar, name } of metadata.avatars) {
            if (hasClaimedName && name && name.trim().length > 0) {
              names.push(name)
            }

            for (const wearableId of avatar.wearables) {
              if (!isBaseWearable(wearableId)) {
                const translatedWearableId = await translateWearablesIdFormat(wearableId)
                if (translatedWearableId) {
                  wearables.push(translatedWearableId)
                }
              }
            }
          }

          isDefaultProfile || thirdPartyWearablesOwnershipChecker.addNFTsForAddress(ethAddress, wearables)

          const [wearablesResult, emotesResult, namesResult] = isDefaultProfile
            ? [{ elements: [] }, { elements: [] }, { elements: [] }]
            : await Promise.all([
                wearablesFetcher.fetchOwnedElements(ethAddress),
                emotesFetcher.fetchOwnedElements(ethAddress),
                namesFetcher.fetchOwnedElements(ethAddress),
                thirdPartyWearablesOwnershipChecker.checkNFTsOwnership()
              ])

          const ownedWearables = wearablesResult.elements
          const ownedEmotes = emotesResult.elements
          const ownedNames = namesResult.elements

          const thirdPartyWearables = isDefaultProfile
            ? []
            : thirdPartyWearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)

          const avatars: Avatar[] = []
          for (const avatar of metadata.avatars) {
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

              if (matchingOwnedWearable) {
                validatedWearables.push(
                  ensureERC721
                    ? `${matchingOwnedWearable.urn}:${
                        tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId
                      }`
                    : matchingOwnedWearable.urn
                )
              }
            }

            const validatedEmotes: { slot: number; urn: string }[] = []
            for (const emote of avatar.avatar.emotes ?? []) {
              if (!emote.urn.includes(':') || isBaseEmote(emote.urn)) {
                validatedEmotes.push(emote)
                continue
              }

              const { urn, tokenId } = splitUrnAndTokenId(emote.urn)

              const matchingOwnedEmote = ownedEmotes.find(
                (ownedEmote) =>
                  ownedEmote.urn === urn &&
                  (!tokenId || ownedEmote.individualData.find((itemData) => itemData.tokenId === tokenId))
              )

              if (matchingOwnedEmote) {
                const urnToReturn = ensureERC721
                  ? `${matchingOwnedEmote.urn}:${tokenId ? tokenId : matchingOwnedEmote.individualData[0].tokenId}`
                  : matchingOwnedEmote.urn

                validatedEmotes.push({ urn: urnToReturn, slot: emote.slot })
              }
            }

            avatars.push({
              ...avatar,
              hasClaimedName: ownedNames.findIndex((name) => name.name === avatar.name) !== -1,
              avatar: {
                ...avatar.avatar,
                emotes: validatedEmotes,
                bodyShape: (await translateWearablesIdFormat(avatar.avatar.bodyShape)) ?? '',
                snapshots: addBaseUrlToSnapshots(entity.id, baseUrl),
                wearables: Array.from(new Set(validatedWearables.concat(thirdPartyWearables)))
              }
            })
          }

          return {
            timestamp: metadata.timestamp,
            avatars
          }
        })
      )
    } catch (error: any) {
      logger.error(error)
      return []
    }
  }

  async function getProfile(ethAddress: string): Promise<ProfileMetadata | undefined> {
    const profiles = await getProfiles([ethAddress])
    return profiles && profiles.length > 0 ? profiles[0] : undefined
  }

  return {
    getProfiles,
    getProfile
  }
}
