import { Outfit, Outfits } from '@dcl/schemas'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { AppComponents, OnChainWearable, TypedEntity } from '../types'
import { splitUrnAndTokenId } from './utils'

export async function getOutfits(
  components: Pick<
    AppComponents,
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches' | 'wearablesFetcher'
  >,
  ethAddress: string
): Promise<TypedEntity<Outfits> | undefined> {
  const { config, wearablesFetcher, content } = components
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'

  const outfitsEntities: TypedEntity<Outfits>[] = await content.fetchEntitiesByPointers([`${ethAddress}:outfits`])

  if (!outfitsEntities || outfitsEntities.length === 0) {
    return undefined
  }

  const outfitsEntity = outfitsEntities[0]
  if (!outfitsEntity.metadata || outfitsEntity.metadata.outfits.length === 0) {
    return outfitsEntities[0]
  }

  const { metadata } = outfitsEntity

  // Outfits containing all wearables owned
  const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(ethAddress)

  const fullyOwnedOutfits: { slot: number; outfit: Outfit }[] = []

  for (const outfit of metadata.outfits) {
    const wearables: string[] = []
    let allWearablesOwned = true

    for (const wearable of outfit.outfit.wearables) {
      const { urn, tokenId } = splitUrnAndTokenId(wearable)
      if (urn.includes('off-chain') || wearable.includes('base-avatars')) {
        wearables.push(urn)
        continue
      }

      const matchingOwnedWearable = ownedWearables.find(
        (ownedWearable) =>
          ownedWearable.urn === urn &&
          (!tokenId || ownedWearable.individualData.some((itemData) => itemData.tokenId === tokenId))
      )

      if (matchingOwnedWearable) {
        wearables.push(
          ensureERC721
            ? `${matchingOwnedWearable.urn}:${tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId}`
            : matchingOwnedWearable.urn
        )
      } else {
        allWearablesOwned = false
        break
      }
    }

    if (allWearablesOwned) {
      fullyOwnedOutfits.push({ ...outfit, outfit: { ...outfit.outfit, wearables } })
    }
  }

  const namesOwnershipChecker = createNamesOwnershipChecker(components)
  namesOwnershipChecker.addNFTsForAddress(ethAddress, metadata.namesForExtraSlots)
  namesOwnershipChecker.checkNFTsOwnership()
  const ownedNames = new Set(namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))

  const normalOutfitsWithOwnedWearables = fullyOwnedOutfits.filter((outfit) => outfit.slot <= 4)
  const extraOutfitsWithOwnedWearables = fullyOwnedOutfits.filter((outfit) => outfit.slot > 4)
  const extraOutfitsWithOwnedWearablesAndNames = extraOutfitsWithOwnedWearables.slice(0, ownedNames.size)

  return {
    ...outfitsEntity,
    metadata: {
      outfits: [...normalOutfitsWithOwnedWearables, ...extraOutfitsWithOwnedWearablesAndNames],
      namesForExtraSlots: Array.from(ownedNames)
    }
  }
}
