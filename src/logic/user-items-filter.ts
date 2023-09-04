import { Avatar, Outfit, Outfits } from '@dcl/schemas'
import { BaseComponents, OnChainEmote, OnChainWearable } from '../types'
import { splitUrnAndTokenId } from './utils'

export type UserItemsFilter = {
  filterNotOwnedItemsFromAvatars(avatar: Avatar[], owner: string): Promise<Avatar[]>
  filterNotOwnedWearablesFromOutfits(outfits: Outfits, owner: string): Promise<Outfits>
}

export async function createUserItemsFilter(
  components: Pick<BaseComponents, 'config' | 'wearablesFetcher' | 'emotesFetcher'>
): Promise<UserItemsFilter> {
  const { wearablesFetcher, emotesFetcher, config } = components
  // If ERC-721 Standard is enabled, all items will be extended to contains the tokenId at the end of the urn.
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'

  async function filterNotOwnedItemsFromAvatars(avatars: Avatar[], owner: string): Promise<Avatar[]> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)
    const ownedEmotes: OnChainEmote[] = await emotesFetcher.fetchOwnedElements(owner)

    // Filter out wearables and emotes that are not owned by the user.
    const sanitizedAvatars: Avatar[] = avatars.map((avatar: Avatar) => {
      const validatedWearables: string[] = avatar.avatar.wearables
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

          return ensureERC721
            ? `${matchingOwnedWearable.urn}:${tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId}`
            : matchingOwnedWearable.urn
        })
        .filter((wearable) => !!wearable) as string[]

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

  async function filterNotOwnedWearablesFromOutfits(outfits: Outfits, owner: string): Promise<Outfits> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)

    const outfitsWithOwnedWearables = outfits.outfits
      .map((outfit) => {
        const outfitWearables = outfit.outfit.wearables.map((wearable) => splitUrnAndTokenId(wearable))

        const isValidOutfit = outfitWearables.every((wearable) =>
          ownedWearables.some(
            (ownedWearable) =>
              ownedWearable.urn === wearable.urn &&
              (!wearable.tokenId ||
                ownedWearable.individualData.find((itemData) => itemData.tokenId === wearable.tokenId))
          )
        )

        if (!isValidOutfit) {
          return undefined
        }

        const outfitWearablesWithTokenId = outfitWearables.map((wearable) => {
          const matchingOwnedWearable = ownedWearables.find(
            (ownedWearable) =>
              ownedWearable.urn === wearable.urn &&
              (!wearable.tokenId ||
                ownedWearable.individualData.find((itemData) => itemData.tokenId === wearable.tokenId))
          )

          return ensureERC721
            ? `${matchingOwnedWearable!.urn}:${
                wearable.tokenId ? wearable.tokenId : matchingOwnedWearable!.individualData[0].tokenId
              }`
            : matchingOwnedWearable!.urn
        })

        return { ...outfit, outfit: { ...outfit.outfit, wearables: outfitWearablesWithTokenId } }
      })
      .filter((outfit) => !!outfit) as { slot: number; outfit: Outfit }[]

    return {
      ...outfits,
      outfits: outfitsWithOwnedWearables
    }
  }

  return { filterNotOwnedItemsFromAvatars, filterNotOwnedWearablesFromOutfits }
}
