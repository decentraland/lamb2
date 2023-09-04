import { Avatar, Outfits } from '@dcl/schemas'
import { BaseComponents, OnChainEmote, OnChainWearable } from '../types'

export type UserItemsFilter = {
  filterNotOwnedItemsFromAvatars(avatar: Avatar[], owner: string): Promise<Avatar[]>
  filterNotOwnedWearablesFromOutfits(outfits: Outfits, owner: string): Promise<Outfits>
}

export async function createUserItemsFilter(
  components: Pick<BaseComponents, 'config' | 'wearablesFetcher' | 'emotesFetcher'>
): Promise<UserItemsFilter> {
  const { wearablesFetcher, emotesFetcher } = components
  // const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'

  async function sanitizeAvatars(avatars: Avatar[], owner: string): Promise<Avatar[]> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)
    const ownedEmotes: OnChainEmote[] = await emotesFetcher.fetchOwnedElements(owner)

    // Filter out wearables and emotes that are not owned by the user.
    const sanitizedAvatars = avatars.map((avatar: Avatar) => {
      const sanitizedWearables = avatar.avatar.wearables.filter((wearable: string) => {
        return (
          ownedWearables.some((ownedWearable) => ownedWearable.urn === wearable) || wearable.includes('base-avatars')
        )
      })

      const sanitizedEmotes = avatar.avatar.emotes?.filter((emote: { slot: number; urn: string } | undefined) => {
        return ownedEmotes.some((ownedEmote) => emote && ownedEmote.urn === emote.urn)
      })

      return { ...avatar, avatar: { ...avatar.avatar, wearables: sanitizedWearables, emotes: sanitizedEmotes } }
    })

    return sanitizedAvatars
  }

  async function sanitizeOutfits(outfits: Outfits, owner: string): Promise<Outfits> {
    const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)

    const outfitsWithOwnedWearables = outfits.outfits.filter((outfit) => {
      const outfitWearables = outfit.outfit.wearables
      return outfitWearables.every((wearable) => ownedWearables.some((ownedWearable) => ownedWearable.urn === wearable))
    })

    return {
      ...outfits,
      outfits: outfitsWithOwnedWearables
    }
  }

  return { filterNotOwnedItemsFromAvatars: sanitizeAvatars, filterNotOwnedWearablesFromOutfits: sanitizeOutfits }
}
