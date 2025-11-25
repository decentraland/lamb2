import { ContractNetwork, createMappingsHelper, Entity, Mappings } from '@dcl/schemas'

/**
 * Core function to check if mappings match NFTs URNs.
 */
function checkMappingsMatch(mappings: Mappings, userOwnedNfts: string[]): boolean {
  if (!mappings) {
    return false
  }

  const entityMappingHelper = createMappingsHelper(mappings)

  for (const nft of userOwnedNfts) {
    const [network, contract, tokenId] = nft.split(':')
    if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
      return true
    }
  }

  return false
}

/**
 * Filters entities by matching their mappings against URNs.
 * Returns entities that the user owns based on URNs.
 */
export function filterByUserNfts<T extends Entity | Partial<Entity>>(entities: T[], userOwnedNfts: string[]): T[] {
  const matchingEntities: T[] = []

  for (const entity of entities) {
    if (checkMappingsMatch(entity.metadata.mappings, userOwnedNfts)) {
      matchingEntities.push(entity)
    }
  }

  return matchingEntities
}

/**
 * Checks if a specific URN matches entity mappings.
 */
export function mappingComprehendsUrn(entityMappings: Mappings, urn: string): boolean {
  return checkMappingsMatch(entityMappings, [urn])
}
