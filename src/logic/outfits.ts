import { Outfits } from '@dcl/schemas'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createWearablesOwnershipChecker } from '../ports/ownership-checker/wearables-ownership-checker'
import { AppComponents, TypedEntity } from '../types'
import { isBaseWearable, resolveUrn } from './utils'

export async function getOutfits(
  components: Pick<AppComponents, 'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches'>,
  ethAddress: string,
  ensureERC721Standard: boolean
): Promise<TypedEntity<Outfits> | undefined> {
  const outfitsEntities: TypedEntity<Outfits>[] = await components.content.fetchEntitiesByPointers([
    `${ethAddress}:outfits`
  ])

  if (!outfitsEntities || outfitsEntities.length === 0) {
    return undefined
  }

  const outfitsEntity = outfitsEntities[0]
  if (!outfitsEntity.metadata || outfitsEntity.metadata.outfits.length === 0) {
    return outfitsEntities[0]
  }

  const outfits = outfitsEntities[0].metadata

  if (!outfits) {
    return undefined
  }

  const wearablesOwnershipChecker = createWearablesOwnershipChecker(components)
  const outfitsWearables = outfits.outfits.flatMap((outfit) =>
    outfit.outfit.wearables.filter((wearable) => !isBaseWearable(wearable))
  )

  await wearablesOwnershipChecker.addNFTsForAddress(ethAddress, outfitsWearables)
  await wearablesOwnershipChecker.checkNFTsOwnership()

  const ownedWearables = new Set(
    wearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress).map((urn) => urn.urn + ':' + urn.tokenId)
  )

  const ownedOutfits = getMatchingOutfits(outfits, ownedWearables, ensureERC721Standard)

  const namesOwnershipChecker = createNamesOwnershipChecker(components)
  namesOwnershipChecker.addNFTsForAddress(ethAddress, outfits.namesForExtraSlots)
  namesOwnershipChecker.checkNFTsOwnership()
  const ownedNames = new Set(namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))

  const normalOutfitsWithOwnedWearables = ownedOutfits.filter((outfit) => outfit.slot <= 4)
  const extraOutfitsWithOwnedWearables = ownedOutfits.filter((outfit) => outfit.slot > 4)
  const extraOutfitsWithOwnedWearablesAndNames = extraOutfitsWithOwnedWearables.slice(0, ownedNames.size)

  return {
    ...outfitsEntity,
    metadata: {
      outfits: [...normalOutfitsWithOwnedWearables, ...extraOutfitsWithOwnedWearablesAndNames],
      namesForExtraSlots: Array.from(ownedNames)
    }
  }
}

function getMatchingOutfits(outfits: Outfits, ownedWearables: Set<string>, ensureERC721Standard: boolean) {
  const parsedOutfits = outfits.outfits.map((outfit) => {
    const { wearables } = outfit.outfit
    let match = false

    match = wearables.map(resolveUrn).every((wearableOnOutfit) => {
      if (wearableOnOutfit.urn.includes('off-chain')) {
        return true
      }

      return wearableOnOutfit.tokenId
        ? ownedWearables.has(`${wearableOnOutfit.urn}:${wearableOnOutfit.tokenId}`)
        : Array.from(ownedWearables).some((ownedWearable) => ownedWearable.startsWith(wearableOnOutfit.urn))
    })

    return {
      outfit: outfit,
      match: match
    }
  })

  return parsedOutfits
    .filter((result) => result.match)
    .map((result) => ({
      ...result.outfit,
      outfit: {
        ...result.outfit.outfit,
        wearables: result.outfit.outfit.wearables
          .map((wearableOnOutfit) => {
            if (isBaseWearable(wearableOnOutfit)) {
              return wearableOnOutfit
            }

            return ensureERC721Standard
              ? Array.from(ownedWearables).find((ownedWearable) => ownedWearable.startsWith(wearableOnOutfit)) || ''
              : wearableOnOutfit
          })
          .filter((parsedWearable) => !!parsedWearable)
      }
    }))
}
