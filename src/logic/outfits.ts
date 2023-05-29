import { Outfits } from '@dcl/schemas'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createWearablesOwnershipChecker } from '../ports/ownership-checker/wearables-ownership-checker'
import { AppComponents, TypedEntity } from '../types'

export async function getOutfits(
  components: Pick<AppComponents, 'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches'>,
  ethAddress: string
): Promise<TypedEntity<Outfits> | undefined> {
  const outfitsEntities: TypedEntity<Outfits>[] = await components.content.fetchEntitiesByPointers([ethAddress])

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
  const outfitsWearables = outfits.outfits.map((outfit) => outfit.outfit.wearables).flat()
  wearablesOwnershipChecker.addNFTsForAddress(ethAddress, outfitsWearables)
  wearablesOwnershipChecker.checkNFTsOwnership()

  const ownedWearables = new Set(wearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))
  const outfitsWithOwnedWearables = outfits.outfits.filter((outfit) => {
    const outfitWearables = outfit.outfit.wearables
    return outfitWearables.every((wearable) => ownedWearables.has(wearable))
  })

  const namesOwnershipChecker = createNamesOwnershipChecker(components)
  namesOwnershipChecker.addNFTsForAddress(ethAddress, outfits.namesForExtraSlots)
  namesOwnershipChecker.checkNFTsOwnership()
  const ownedNames = new Set(namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))

  const normalOutfitsWithOwnedWearables = outfitsWithOwnedWearables.filter((outfit) => outfit.slot <= 4)
  const extraOutfitsWithOwnedWearables = outfitsWithOwnedWearables.filter((outfit) => outfit.slot > 4)
  const extraOutfitsWithOwnedWearablesAndNames = extraOutfitsWithOwnedWearables.slice(0, ownedNames.size)

  return {
    ...outfitsEntity,
    metadata: {
      outfits: [...normalOutfitsWithOwnedWearables, ...extraOutfitsWithOwnedWearablesAndNames],
      namesForExtraSlots: Array.from(ownedNames)
    }
  }
}
