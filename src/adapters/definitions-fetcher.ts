import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Definition } from '../types'
import { extractEmoteDefinitionFromEntity, extractWearableDefinitionFromEntity } from './definitions'
import { Entity } from '@dcl/schemas'

export type DefinitionsFetcher = IBaseComponent & {
  fetchWearablesDefinitions(urns: string[]): Promise<(Definition | undefined)[]>
  fetchEmotesDefinitions(urns: string[]): Promise<(Definition | undefined)[]>
}

export async function createDefinitionsFetcherComponent({
  config,
  content
}: Pick<AppComponents, 'logs' | 'config' | 'content'>): Promise<DefinitionsFetcher> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 1000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  // TODO create lower case cache, get/set wrapped to set the key to lowercase
  const itemDefinitionsCache = new LRU<string, Definition>({
    max: itemsSize,
    ttl: itemsAge
  })

  async function fetchItemsDefinitions(
    urns: string[],
    mapEntityToDefinition: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
  ): Promise<(Definition | undefined)[]> {
    const nonCachedURNs: string[] = []
    for (const urn of urns) {
      const definition = itemDefinitionsCache.get(urn.toLowerCase())
      if (!definition) {
        nonCachedURNs.push(urn)
      }
    }

    if (nonCachedURNs.length !== 0) {
      const entities = await content.fetchEntitiesByPointers(nonCachedURNs)
      for (const entity of entities) {
        const definition = mapEntityToDefinition({ content }, entity)
        itemDefinitionsCache.set(definition.id.toLowerCase(), definition)
      }
    }

    return urns.map((urn) => itemDefinitionsCache.get(urn.toLowerCase()))
  }

  return {
    fetchWearablesDefinitions: (urns) => fetchItemsDefinitions(urns, extractWearableDefinitionFromEntity),
    fetchEmotesDefinitions: (urns) => fetchItemsDefinitions(urns, extractEmoteDefinitionFromEntity)
  }
}
