import { AppComponents, Definition } from '../types'
import { IBaseComponent } from '@well-known-components/interfaces'
import LRU from 'lru-cache'
import { EntityType } from 'dcl-catalyst-commons'
import { Entity } from '@dcl/schemas'

export type DefinitionsComponent = IBaseComponent & {
  decorateNFTsWithDefinitions: (
    nfts: NFT[],
    entityType: EntityType,
    extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
  ) => Promise<void>
}

export type NFT = {
  urn: string
  amount: number
  definition?: Definition
}

export async function createDefinitionsComponent({
  config,
  content
}: Pick<AppComponents, 'content' | 'config'>): Promise<DefinitionsComponent> {
  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) || 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) || 600000 // 10 minutes by default

  const definitionsCache = new LRU<string, Definition>({ max: wearablesSize, ttl: wearablesAge })

  async function decorateNFTsWithDefinitions(
    nfts: NFT[],
    entityType: EntityType,
    extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
  ) {
    const nonCachedURNs: string[] = []
    nfts.forEach((nft) => {
      const definition = definitionsCache.get(nft.urn)
      if (!definition) {
        nonCachedURNs.push(nft.urn)
      }
    })

    // Fetch entities for non-cached urns
    if (nonCachedURNs.length !== 0) {
      const entities = await content.fetchEntitiesByPointers(entityType, nonCachedURNs)
      for (const entity of entities) {
        const definition = extractDefinitionFromEntity({ content }, entity)
        definitionsCache.set(definition.id.toLowerCase(), definition)
      }
    }

    for (const nft of nfts) {
      nft.definition = definitionsCache.get(nft.urn)
    }
  }

  return {
    decorateNFTsWithDefinitions
  }
}
