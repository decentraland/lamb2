import { Entity } from '@dcl/schemas'
import { EntityType } from 'dcl-catalyst-commons'
import LRU from 'lru-cache'
import { AppComponents, Definition, UrnAndAmount } from '../types'

/*
 * Looks for the definitions of the provided emotes' urns and add them to them.
 */
export async function decorateNFTsWithDefinitionsFromCache(
  nfts: UrnAndAmount[],
  components: Pick<AppComponents, 'content'>,
  definitionsCache: LRU<string, Definition>,
  entityType: EntityType,
  extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
) {
  // Get a map with the definitions from the cache and an array with the non-cached urns
  const { nonCachedURNs, definitionsByURN } = getDefinitionsFromCache(nfts, definitionsCache)

  // Fetch entities for non-cached urns
  let entities: Entity[] = []
  if (nonCachedURNs.length !== 0) entities = await components.content.fetchEntitiesByPointers(entityType, nonCachedURNs)

  // Translate entities to definitions
  const translatedDefinitions: Definition[] = entities.map((entity) => extractDefinitionFromEntity(components, entity))

  // Store new definitions in cache and in map
  translatedDefinitions.forEach((definition) => {
    definitionsCache.set(definition.id.toLowerCase(), definition)
    definitionsByURN.set(definition.id.toLowerCase(), definition)
  })

  // Decorate provided nfts with definitions
  return nfts.map((nft) => {
    return {
      ...nft,
      definition: definitionsByURN.get(nft.urn)
    }
  })
}

/*
 * Try to get the definitions from cache. Present ones are retrieved as a map urn -> definition.
 * Not present ones are retrieved as an array to fetch later
 */
function getDefinitionsFromCache(nfts: UrnAndAmount[], definitionsCache: LRU<string, Definition>) {
  const nonCachedURNs: string[] = []
  const definitionsByURN = new Map<string, Definition>()
  nfts.forEach((nft) => {
    const definition = definitionsCache.get(nft.urn)
    if (definition) {
      definitionsByURN.set(nft.urn, definition)
    } else {
      nonCachedURNs.push(nft.urn)
    }
  })

  return { nonCachedURNs, definitionsByURN }
}
