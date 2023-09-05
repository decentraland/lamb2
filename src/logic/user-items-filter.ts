import { Avatar, Outfit, Outfits } from '@dcl/schemas'
import { BaseComponents, OnChainEmote, OnChainWearable } from '../types'
import { splitUrnAndTokenId } from './utils'

export type UserItemsFilter = {
  filterNotOwnedItemsFromAvatars(avatar: Avatar[], owner: string): Promise<Avatar[]>
  filterOutfitsWithoutCompleteOwnership(outfits: Outfits, owner: string): Promise<Outfits>
}

function isValidOutfit(outfit: Outfit, ownedWearables: OnChainWearable[]) {
  const parsedWearables = outfit.wearables.map((wearable) => splitUrnAndTokenId(wearable))
  return parsedWearables.every((wearable) => {
    if (wearable.urn.includes('off-chain')) {
      return true
    }

    const matchingOwnedWearable = ownedWearables.find(
      (ownedWearable) =>
        ownedWearable.urn === wearable.urn &&
        (!wearable.tokenId || ownedWearable.individualData.some((itemData) => itemData.tokenId === wearable.tokenId))
    )

    return !!matchingOwnedWearable
  })
}

function parseValidWearablesAndFilterInvalidOnes(
  wearablesUrn: string[],
  ownedWearables: OnChainWearable[],
  shouldExtendWearables: boolean
) {
  return wearablesUrn
    .map((wearable: string) => {
      if (wearable.includes('base-avatars')) {
        return wearable
      }

      const { urn, tokenId } = splitUrnAndTokenId(wearable)

      const matchingOwnedWearable = ownedWearables.find(
        (ownedWearable) =>
          ownedWearable.urn === urn &&
          (!tokenId || ownedWearable.individualData.find((itemData) => itemData.tokenId === tokenId))
      )

      if (!matchingOwnedWearable) {
        return undefined
      }

      return shouldExtendWearables
        ? `${matchingOwnedWearable.urn}:${tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId}`
        : matchingOwnedWearable.urn
    })
    .filter((wearable) => !!wearable) as string[]
}

export async function createUserItemsFilter(
  components: Pick<BaseComponents, 'config' | 'wearablesFetcher' | 'emotesFetcher'>
): Promise<UserItemsFilter> {
  const { wearablesFetcher, emotesFetcher, config } = components
  // If ERC-721 Standard is enabled, all items will be extended to contain the tokenId at the end of the urn.
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'

  /**
   * Filter out wearables and emotes that are not owned by the user.
   *
   * @param {Avatar[]} avatars
   * @param {string} owner
   * @return {*}  {Promise<Avatar[]>}
   */
  async function filterNotOwnedItemsFromAvatars(avatars: Avatar[], owner: string): Promise<Avatar[]> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)
    const ownedEmotes: OnChainEmote[] = await emotesFetcher.fetchOwnedElements(owner)

    // Filter out wearables and emotes that are not owned by the user.
    const sanitizedAvatars: Avatar[] = avatars.map((avatar: Avatar) => {
      const validatedWearables: string[] = parseValidWearablesAndFilterInvalidOnes(
        avatar.avatar.wearables,
        ownedWearables,
        ensureERC721
      )

      const validatedEmotes = avatar.avatar.emotes
        ?.map((emote: { urn: string; slot: number }) => {
          if (!emote.urn.includes(':')) {
            return emote
          }

          let urnToReturn: string = emote.urn

          const { urn, tokenId } = splitUrnAndTokenId(emote.urn)

          const matchingOwnedEmote = ownedEmotes.find(
            (ownedEmote) =>
              ownedEmote.urn === urn &&
              (!tokenId || ownedEmote.individualData.find((itemData) => itemData.tokenId === tokenId))
          )

          if (!matchingOwnedEmote) {
            return undefined
          }

          urnToReturn = ensureERC721
            ? `${matchingOwnedEmote.urn}:${tokenId ? tokenId : matchingOwnedEmote.individualData[0].tokenId}`
            : matchingOwnedEmote.urn

          return { urn: urnToReturn, slot: emote.slot }
        })
        .filter((emote) => !!emote) as { urn: string; slot: number }[]

      return { ...avatar, avatar: { ...avatar.avatar, wearables: validatedWearables, emotes: validatedEmotes } }
    })

    return sanitizedAvatars
  }

  /**
   * Filter out outfits that contain wearables not owned by the user.
   *
   * @param {Outfits} outfits
   * @param {string} owner
   * @return {*}  {Promise<Outfits>}
   */
  async function filterOutfitsWithoutCompleteOwnership(outfits: Outfits, owner: string): Promise<Outfits> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)

    const outfitsWithOwnedWearables = outfits.outfits
      .map((outfit) => {
        if (!isValidOutfit(outfit.outfit, ownedWearables)) {
          return undefined
        }

        const parsedOutfitsWearables = parseValidWearablesAndFilterInvalidOnes(
          outfit.outfit.wearables,
          ownedWearables,
          ensureERC721
        )

        return { ...outfit, outfit: { ...outfit.outfit, wearables: parsedOutfitsWearables } }
      })
      .filter((outfit) => !!outfit) as { slot: number; outfit: Outfit }[]

    return {
      ...outfits,
      outfits: outfitsWithOwnedWearables
    }
  }

  return { filterNotOwnedItemsFromAvatars, filterOutfitsWithoutCompleteOwnership }
}
