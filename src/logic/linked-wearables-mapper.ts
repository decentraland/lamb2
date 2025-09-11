import { ContractNetwork, createMappingsHelper, Entity, Mapping } from '@dcl/schemas'

/**
 * Core function to check if mappings match user NFTs.
 * Supports both multiple NFTs (userOwnedNfts) and single NFT (singleNft).
 */
function checkMappingsMatch(mappings: any, userOwnedNfts?: string[], singleNft?: string): boolean {
  if (!mappings) {
    return false
  }

  const entityMappingHelper = createMappingsHelper(mappings)

  // Single NFT check (for individual assignment)
  if (singleNft) {
    const [network, contract, tokenId] = singleNft.split(':')
    return entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)
  }

  // Multiple NFTs check (for filtering)
  if (userOwnedNfts) {
    for (const nft of userOwnedNfts) {
      const [network, contract, tokenId] = nft.split(':')
      if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
        return true
      }
    }
  }

  return false
}

/**
 * Filters entities by matching their mappings against user-owned NFTs.
 * Returns entities that the user owns based on NFT mappings.
 */
export function filterByUserNfts(entities: Entity[], userOwnedNfts: string[]): Entity[] {
  const matchingEntities: Entity[] = []

  for (const entity of entities) {
    if (checkMappingsMatch(entity.metadata.mappings, userOwnedNfts)) {
      matchingEntities.push(entity)
    }
  }

  return matchingEntities
}

/**
 * Checks if a specific NFT matches entity mappings.
 * Used for building individual NFT assignments to entities.
 */
export function mappingComprehendsEntity(entityMappings: Mapping, nftUrn: string): boolean {
  return checkMappingsMatch(entityMappings, undefined, nftUrn)
}
