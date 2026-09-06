import { AppComponents, Name, OnChainEmote, OnChainWearable, ProfileMetadata } from '../types'
import { Avatar, Entity, LinkUrl, Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { splitUrnAndTokenId } from '../logic/utils'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'

type OwnedElements = [{ elements: OnChainWearable[] }, { elements: OnChainEmote[] }, { elements: Name[] }]

const NOTHING_OWNED: OwnedElements = [{ elements: [] }, { elements: [] }, { elements: [] }]

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
function addBaseUrlToSnapshots(entityId: string, baseUrl: string, snapshots: Snapshots): Snapshots {
  snapshots.body = addBaseUrlToSnapshot(entityId, baseUrl, 'body')
  snapshots.face256 = addBaseUrlToSnapshot(entityId, baseUrl, 'face')
  return snapshots
}

function addBaseUrlToSnapshot(entityId: string, baseUrl: string, which: string): string {
  const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  return cleanedBaseUrl + `entities/${entityId}/${which}.png`
}

export function sanitizeLinks(links: Avatar['links']): Avatar['links'] {
  if (!links || links.length === 0) {
    return links
  }

  return links.reduce<NonNullable<Avatar['links']>>((acc, link) => {
    if (LinkUrl.validate(link.url)) {
      acc.push(link)
      return acc
    }

    try {
      const decoded = decodeURIComponent(link.url)
      if (LinkUrl.validate(decoded)) {
        acc.push({ ...link, url: decoded })
      }
    } catch {
      // decodeURIComponent can throw on malformed input — drop the link
    }

    return acc
  }, [])
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

  /**
   * The non-base wearables an avatar wears, in the urn format the fetchers use. Legacy `dcl://`
   * ids are translated; base wearables are always owned and skipped.
   */
  async function collectWearableIds(metadata: ProfileMetadata): Promise<string[]> {
    const wearableIds = metadata.avatars
      .flatMap((avatar) => avatar.avatar.wearables)
      .filter((wearableId) => !isBaseWearable(wearableId))
    const translated = await Promise.all(wearableIds.map(translateWearablesIdFormat))
    return translated.filter((wearableId): wearableId is string => !!wearableId)
  }

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

      // Every profile registers its third-party wearables before the check runs, so ownership
      // is resolved once for the whole batch rather than once per profile.
      const thirdPartyWearablesOwnershipChecker = createTPWOwnershipChecker(components)
      const profiles = await Promise.all(
        profileEntities.map(async (entity) => {
          const ethAddress = entity.pointers[0]
          const isDefaultProfile: boolean = ethAddress.startsWith('default')
          const metadata: ProfileMetadata = entity.metadata

          metadata.timestamp = entity.timestamp

          if (!isDefaultProfile) {
            thirdPartyWearablesOwnershipChecker.addNFTsForAddress(ethAddress, await collectWearableIds(metadata))
          }

          return { entity, ethAddress, isDefaultProfile, metadata }
        })
      )

      const [ownedByProfile] = await Promise.all([
        Promise.all(
          profiles.map(({ ethAddress, isDefaultProfile }): Promise<OwnedElements> => {
            if (isDefaultProfile) {
              return Promise.resolve(NOTHING_OWNED)
            }

            return Promise.all([
              wearablesFetcher.fetchOwnedElements(ethAddress),
              emotesFetcher.fetchOwnedElements(ethAddress),
              namesFetcher.fetchOwnedElements(ethAddress)
            ])
          })
        ),
        thirdPartyWearablesOwnershipChecker.checkNFTsOwnership()
      ])

      return await Promise.all(
        profiles.map(async ({ entity, ethAddress, isDefaultProfile, metadata }, index) => {
          const [wearablesResult, emotesResult, namesResult] = ownedByProfile[index]
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
              // The pointer is the authoritative identity, not the deployed metadata
              ...(isDefaultProfile ? {} : { userId: ethAddress, ethAddress }),
              links: sanitizeLinks(avatar.links),
              hasClaimedName: ownedNames.findIndex((name) => name.name === avatar.name) !== -1,
              avatar: {
                ...avatar.avatar,
                emotes: validatedEmotes,
                bodyShape: (await translateWearablesIdFormat(avatar.avatar.bodyShape)) ?? '',
                snapshots: addBaseUrlToSnapshots(
                  entity.id,
                  baseUrl,
                  avatar.avatar.snapshots || { face256: '', body: '' }
                ),
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
