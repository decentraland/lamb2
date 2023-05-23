import { Outfits } from '@dcl/schemas'
import { createNamesOwnershipChecker } from '../ports/ownership-checker/names-ownership-checker'
import { createWearablesOwnershipChecker } from '../ports/ownership-checker/wearables-ownership-checker'
import { AppComponents, TypedEntity } from '../types'

// function createWearablesQuery(category: string) {
//   return `query fetchOwnedWearables($owner: String, $idFrom: String) {
//     nfts(
//       where: { id_gt: $idFrom, owner: $owner, category: "${category}"},
//       orderBy: id,
//       orderDirection: asc,
//       first: ${THE_GRAPH_PAGE_SIZE}
//     ) {
//       urn,
//       id,
//       tokenId,
//       category,
//       transferredAt,
//       metadata {
//         ${category} {
//           name,
//           category
//         }
//       },
//       item {
//         rarity,
//         price
//       }
//     }
//   }`
// }

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

  const outfits = outfitsEntities[0].metadata as Outfits

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
  namesOwnershipChecker.checkNFTsOwnership()
  const ownedNames = new Set(namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))
  let extraSlots = ownedNames.size

  const outfitsWithOwnedNamesAndWearables = outfitsWithOwnedWearables.filter((outfit) => {
    const isExtraSlot = outfit.slot > 4
    if (!isExtraSlot) {
      return true
    } else {
      if (extraSlots > 0) {
        extraSlots--
        return true
      }
      return false
    }
  })

  return {
    ...outfitsEntity,
    metadata: {
      outfits: outfitsWithOwnedNamesAndWearables,
      namesForExtraSlots: Array.from(ownedNames)
    }
  }
}
