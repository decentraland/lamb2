import { AppComponents, Name, OnChainEmote, OnChainWearable, ProfileMetadata, ServiceOverloadedError } from '../types'
import { Avatar, Entity, LinkUrl, Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { splitUrnAndTokenId } from '../logic/utils'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'
import { LRUCache } from 'lru-cache'
import { mapWithConcurrency } from '../logic/concurrency'

type OwnedElements = [{ elements: OnChainWearable[] }, { elements: OnChainEmote[] }, { elements: Name[] }]

const NOTHING_OWNED: OwnedElements = [{ elements: [] }, { elements: [] }, { elements: [] }]

/**
 * Profiles whose inventories are fetched at once within a single batch. The bound is per request,
 * so a heavy batch slows only its own caller instead of queueing ahead of everyone else.
 */
const MAX_PROFILES_IN_FLIGHT = 8

/**
 * Memo key for an assembled profile. The entity id alone is not enough: the assembled value
 * carries the pointer as its identity and is filtered by that address's ownership.
 */
function assembledProfileKey(entity: Entity): string {
  return `${entity.pointers[0]}:${entity.id}`
}

/**
 * Memoized profiles are shared between requests and must not alias the entity they were built
 * from, so the stored value is a private copy, frozen: an accidental mutation throws instead of
 * poisoning later requests, and the entity's own objects stay untouched.
 */
function freezeCopy<T>(value: T): T {
  return deepFreeze(structuredClone(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested)
    }
  }

  return value
}

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
  const assembledSize = (await config.getNumber('PROFILES_CACHE_MAX_SIZE')) ?? 10_000
  const assembledAge = (await config.getNumber('PROFILES_CACHE_MAX_AGE')) ?? 60_000

  // Keyed by entity id: a new deployment gets a new id, so an entry can only go stale through
  // an ownership change, and the age bounds how long that is served.
  const assembledProfiles = new LRUCache<string, ProfileMetadata>({ max: assembledSize, ttl: assembledAge })
  // Deployments being assembled right now, so a concurrent request joins them instead of repeating them.
  const assembling = new Map<string, Promise<ProfileMetadata>>()

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

  /** Resolves ownership for the given profile entities and builds their public representation. */
  async function assembleProfiles(profileEntities: Entity[]): Promise<ProfileMetadata[]> {
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
      mapWithConcurrency(profiles, MAX_PROFILES_IN_FLIGHT, fetchOwnedElementsOf),
      thirdPartyWearablesOwnershipChecker.checkNFTsOwnership()
    ])

    return Promise.all(
      profiles.map(async ({ entity, ethAddress, isDefaultProfile, metadata }, index) => {
        const [wearablesResult, emotesResult, namesResult] = ownedByProfile[index]
        // Indexed once: an avatar is validated against the whole inventory, and whales own
        // thousands of items.
        const ownedWearablesByUrn = new Map(wearablesResult.elements.map((wearable) => [wearable.urn, wearable]))
        const ownedEmotesByUrn = new Map(emotesResult.elements.map((emote) => [emote.urn, emote]))
        const ownedNames = new Set(namesResult.elements.map((name) => name.name))

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

            const ownedWearable = ownedWearablesByUrn.get(urn)
            const matchingOwnedWearable =
              ownedWearable &&
              (!tokenId || ownedWearable.individualData.some((itemData) => itemData.tokenId === tokenId))
                ? ownedWearable
                : undefined

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

            const ownedEmote = ownedEmotesByUrn.get(urn)
            const matchingOwnedEmote =
              ownedEmote && (!tokenId || ownedEmote.individualData.some((itemData) => itemData.tokenId === tokenId))
                ? ownedEmote
                : undefined

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
            hasClaimedName: ownedNames.has(avatar.name),
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
  }

  /** The three inventories a profile is validated against; a default profile owns nothing. */
  function fetchOwnedElementsOf({
    ethAddress,
    isDefaultProfile
  }: {
    ethAddress: string
    isDefaultProfile: boolean
  }): Promise<OwnedElements> {
    if (isDefaultProfile) {
      return Promise.resolve(NOTHING_OWNED)
    }

    return Promise.all([
      wearablesFetcher.fetchOwnedElements(ethAddress),
      emotesFetcher.fetchOwnedElements(ethAddress),
      namesFetcher.fetchOwnedElements(ethAddress)
    ])
  }

  /**
   * Assembles the entities, publishing each one's pending result so a concurrent request joins it
   * instead of assembling the same deployment twice, and memoizes the outcome.
   */
  async function assembleAndMemoize(entities: Entity[]): Promise<Map<string, ProfileMetadata>> {
    if (entities.length === 0) {
      return new Map()
    }

    const assembly = assembleProfiles(entities).then((profiles) => profiles.map(freezeCopy))
    entities.forEach((entity, index) => {
      const pending = assembly.then((profiles) => profiles[index])
      // A joiner sees a failure through its own await; without this, a batch nobody joined would
      // surface it as an unhandled rejection.
      pending.catch(() => undefined)
      assembling.set(assembledProfileKey(entity), pending)
    })

    try {
      const profiles = await assembly
      const byKey = new Map(entities.map((entity, index) => [assembledProfileKey(entity), profiles[index]]))
      for (const [key, profile] of byKey) {
        assembledProfiles.set(key, profile)
      }
      return byKey
    } finally {
      for (const entity of entities) {
        assembling.delete(assembledProfileKey(entity))
      }
    }
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

      // Memoized deployments are served as they are, ones another request is already assembling
      // are awaited from it, and only the rest go through ownership here.
      const cached = new Map<string, ProfileMetadata>()
      const joined = new Map<string, Promise<ProfileMetadata>>()
      const entitiesToAssemble: Entity[] = []
      for (const entity of profileEntities) {
        const key = assembledProfileKey(entity)
        const assembled = assembledProfiles.get(key)
        const pending = assembling.get(key)
        if (assembled) {
          cached.set(key, assembled)
        } else if (pending) {
          joined.set(key, pending)
        } else {
          entitiesToAssemble.push(entity)
        }
      }

      const freshByKey = await assembleAndMemoize(entitiesToAssemble)
      const joinedByKey = new Map(
        await Promise.all(Array.from(joined, async ([key, pending]) => [key, await pending] as const))
      )

      return profileEntities.map(
        (entity) =>
          cached.get(assembledProfileKey(entity)) ??
          freshByKey.get(assembledProfileKey(entity)) ??
          joinedByKey.get(assembledProfileKey(entity))!
      )
    } catch (error: any) {
      // Shed load has to reach the client as a retryable failure, not as an empty profile list.
      if (error instanceof ServiceOverloadedError) {
        throw error
      }

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
