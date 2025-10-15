import { Outfit, Outfits } from '@dcl/schemas'
import { AppComponents, TypedEntity } from '../types'
import { splitUrnAndTokenId } from './utils'
import { createTPWOwnershipChecker } from '../ports/ownership-checker/tpw-ownership-checker'

export async function getOutfits(
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
    | 'wearablesFetcher'
    | 'namesFetcher'
    | 'l1ThirdPartyItemChecker'
    | 'l2ThirdPartyItemChecker'
    | 'thirdPartyProvidersStorage'
    | 'logs'
  >,
  ethAddress: string
): Promise<TypedEntity<Outfits> | undefined> {
  const { config, wearablesFetcher, namesFetcher, content } = components
  const ensureERC721 = (await config.getString('ENSURE_ERC_721')) !== 'false'
  const thirdPartyWearablesOwnershipChecker = createTPWOwnershipChecker(components)

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
  const ownedWearablesResult = await wearablesFetcher.fetchOwnedElements(ethAddress)
  const ownedWearables = ownedWearablesResult?.elements || []

  const fullyOwnedOutfits: { slot: number; outfit: Outfit }[] = []

  for (const outfit of metadata.outfits) {
    const wearables: string[] = []
    const thirdPartyWearables: string[] = []
    let allWearablesOwned = true

    for (const wearable of outfit.outfit.wearables) {
      if (wearable.includes('off-chain') || wearable.includes('base-avatars')) {
        wearables.push(wearable)
        continue
      } else if (wearable.includes('collections-thirdparty')) {
        wearables.push(wearable)
        thirdPartyWearables.push(wearable)
        continue
      }

      const { urn, tokenId } = splitUrnAndTokenId(wearable)

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

    if (thirdPartyWearables.length > 0) {
      thirdPartyWearablesOwnershipChecker.addNFTsForAddress(ethAddress, thirdPartyWearables)
      await thirdPartyWearablesOwnershipChecker.checkNFTsOwnership()
      const thirdPartyWearablesOwned = thirdPartyWearablesOwnershipChecker.getOwnedNFTsForAddress(ethAddress)

      allWearablesOwned = thirdPartyWearables.every((tpWearable: string) =>
        thirdPartyWearablesOwned.includes(tpWearable)
      )
    }

    if (allWearablesOwned) {
      fullyOwnedOutfits.push({ ...outfit, outfit: { ...outfit.outfit, wearables } })
    }
  }

  // Outfits containing all names owned
  const ownedNamesResult = await namesFetcher.fetchOwnedElements(ethAddress)
  const names = ownedNamesResult?.elements || []

  const normalOutfitsWithOwnedWearables = fullyOwnedOutfits.filter((outfit) => outfit.slot <= 4)
  const extraOutfitsWithOwnedWearables = fullyOwnedOutfits.filter((outfit) => outfit.slot > 4)
  const extraOutfitsWithOwnedWearablesAndNames = extraOutfitsWithOwnedWearables.slice(0, names.length)

  const outfitsWithWearablesInLowerCase = [
    ...normalOutfitsWithOwnedWearables,
    ...extraOutfitsWithOwnedWearablesAndNames
  ].map((outfit) => ({
    ...outfit,
    outfit: {
      ...outfit.outfit,
      wearables: outfit.outfit.wearables.map((wearable) => wearable.toLowerCase())
    }
  }))

  return {
    ...outfitsEntity,
    metadata: {
      outfits: outfitsWithWearablesInLowerCase,
      namesForExtraSlots: names.map((name) => name.name)
    }
  }
}
