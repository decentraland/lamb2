import { AppComponents, Definition, UrnAndAmount } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import LRU from 'lru-cache'
import { EntityType } from 'dcl-catalyst-commons'
import { Entity } from '@dcl/schemas'

export type DefinitionsComponent = IBaseComponent & {
  decorateNFTsWithDefinitions: (
    nfts: UrnAndAmount[],
    entityType: EntityType,
    extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
  ) => Promise<void>
}

export async function createDefinitionsComponent({
  config,
  content
}: Pick<AppComponents, 'content' | 'config'>): Promise<DefinitionsComponent> {
  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) || 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) || 600000 // 10 minutes by default

  const definitionsCache = new LRU<string, Definition>({ max: wearablesSize, ttl: wearablesAge })

  async function decorateNFTsWithDefinitions(
    nfts: UrnAndAmount[],
    entityType: EntityType,
    extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
  ) {
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

    // Fetch entities for non-cached urns
    let entities: Entity[] = []
    if (nonCachedURNs.length !== 0) {
      entities = await content.fetchEntitiesByPointers(entityType, nonCachedURNs)
    }

    // Translate entities to definitions
    const translatedDefinitions: Definition[] = entities.map((entity) =>
      extractDefinitionFromEntity({ content }, entity)
    )

    // Store new definitions in cache and in map
    translatedDefinitions.forEach((definition) => {
      definitionsCache.set(definition.id.toLowerCase(), definition)
      definitionsByURN.set(definition.id.toLowerCase(), definition)
    })

    // Decorate provided nfts with definitions
    nfts.map((nft) => {
      return {
        ...nft,
        definition: definitionsByURN.get(nft.urn)
      }
    })
  }

  return {
    decorateNFTsWithDefinitions
  }
}
