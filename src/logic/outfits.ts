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

  // Outfits containing all wearables owned
  const fullyOwnedOutfits = await filterOutfitsWithoutCompleteOwnership(components, outfits, ethAddress)

  const namesOwnershipChecker = createNamesOwnershipChecker(components)
  namesOwnershipChecker.addNFTsForAddress(ethAddress, outfits.namesForExtraSlots)
  namesOwnershipChecker.checkNFTsOwnership()
  const ownedNames = new Set(namesOwnershipChecker.getOwnedNFTsForAddress(ethAddress))

  const normalOutfitsWithOwnedWearables = fullyOwnedOutfits.outfits.filter((outfit) => outfit.slot <= 4)
  const extraOutfitsWithOwnedWearables = fullyOwnedOutfits.outfits.filter((outfit) => outfit.slot > 4)
  const extraOutfitsWithOwnedWearablesAndNames = extraOutfitsWithOwnedWearables.slice(0, ownedNames.size)

  return {
    ...outfitsEntity,
    metadata: {
      outfits: [...normalOutfitsWithOwnedWearables, ...extraOutfitsWithOwnedWearablesAndNames],
      namesForExtraSlots: Array.from(ownedNames)
    }
  }
}

function isOwnedOutfit(outfit: Outfit, ownedWearables: OnChainWearable[]) {
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
): string[] {
  const wearablesUrnToReturn: string[] = []

  for (let i = 0; i < wearablesUrn.length; i++) {
    const wearable = wearablesUrn[i]

    if (wearable.includes('base-avatars')) {
      wearablesUrnToReturn.push(wearable)
      continue
    }

    const { urn, tokenId } = splitUrnAndTokenId(wearable)

    const matchingOwnedWearable = ownedWearables.find(
      (ownedWearable) =>
        ownedWearable.urn === urn &&
        (!tokenId || ownedWearable.individualData.find((itemData) => itemData.tokenId === tokenId))
    )

    if (!matchingOwnedWearable) {
      continue
    }

    wearablesUrnToReturn.push(
      shouldExtendWearables
        ? `${matchingOwnedWearable.urn}:${tokenId ? tokenId : matchingOwnedWearable.individualData[0].tokenId}`
        : matchingOwnedWearable.urn
    )
  }

  return wearablesUrnToReturn
}

async function filterOutfitsWithoutCompleteOwnership(
  components: Pick<AppComponents, 'wearablesFetcher' | 'config'>,
  outfits: Outfits,
  owner: string
): Promise<Outfits> {
  const { config, wearablesFetcher } = components
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) === 'true'
  const ownedWearables: OnChainWearable[] = await wearablesFetcher.fetchOwnedElements(owner)

  const outfitsToReturn: { slot: number; outfit: Outfit }[] = []

  for (let i = 0; i < outfits.outfits.length; i++) {
    const outfit = outfits.outfits[i]

    if (!isOwnedOutfit(outfit.outfit, ownedWearables)) {
      continue
    }

    const parsedOutfitsWearables = parseValidWearablesAndFilterInvalidOnes(
      outfit.outfit.wearables,
      ownedWearables,
      ensureERC721
    )

    outfitsToReturn.push({ ...outfit, outfit: { ...outfit.outfit, wearables: parsedOutfitsWearables } })
  }

  return {
    ...outfits,
    outfits: outfitsToReturn
  }
}
