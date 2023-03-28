import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import { EmoteDefinition, Entity, WearableDefinition } from '@dcl/schemas'
import { extractEmoteDefinitionFromEntity, extractWearableDefinitionFromEntity } from './definitions'

export type DefinitionsFetcher<T extends WearableDefinition | EmoteDefinition> = IBaseComponent & {
  fetchItemsDefinitions(urns: string[]): Promise<(T | undefined)[]>
}

async function createDefinitionsFetcherComponent<T extends WearableDefinition | EmoteDefinition>(
  { config, content }: Pick<AppComponents, 'logs' | 'config' | 'content'>,
  entityMapper: (components: Pick<AppComponents, 'content'>, entity: Entity) => T
): Promise<DefinitionsFetcher<T>> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 1000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  // TODO create lower case cache, get/set wrapped to set the key to lowercase
  const itemDefinitionsCache = new LRU<string, T>({
    max: itemsSize,
    ttl: itemsAge
  })

  return {
    async fetchItemsDefinitions(urns: string[]): Promise<(T | undefined)[]> {
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
          const definition = entityMapper({ content }, entity)
          itemDefinitionsCache.set(definition.id.toLowerCase(), definition)
        }
      }

      return urns.map((urn) => itemDefinitionsCache.get(urn.toLowerCase()))
    }
  }
}

export async function createWearableDefinitionsFetcherComponent(
  components: Pick<AppComponents, 'logs' | 'config' | 'content'>
) {
  return createDefinitionsFetcherComponent<WearableDefinition>(components, extractWearableDefinitionFromEntity)
}

export async function createEmoteDefinitionsFetcherComponent(
  components: Pick<AppComponents, 'logs' | 'config' | 'content'>
) {
  return createDefinitionsFetcherComponent<EmoteDefinition>(components, extractEmoteDefinitionFromEntity)
}
