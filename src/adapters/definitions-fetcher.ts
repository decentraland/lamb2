import { EmoteDefinition, Entity, WearableDefinition } from '@dcl/schemas'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import { extractEmoteDefinitionFromEntity, extractWearableDefinitionFromEntity } from './definitions'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import { createLowerCaseKeysMap } from './lowercase-keys-map'

export type DefinitionsFetcher<T extends WearableDefinition | EmoteDefinition> = IBaseComponent & {
  fetchItemsDefinitions(urns: string[]): Promise<(T | undefined)[]>
}

async function createDefinitionsFetcherComponent<T extends WearableDefinition | EmoteDefinition>(
  { config, content, contentServerUrl }: Pick<AppComponents, 'logs' | 'config' | 'content' | 'contentServerUrl'>,
  entityMapper: (components: Pick<AppComponents, 'contentServerUrl'>, entity: Entity) => T
): Promise<DefinitionsFetcher<T>> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 10000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  const itemDefinitionsCache = createLowerCaseKeysCache<T>({ max: itemsSize, ttl: itemsAge })

  return {
    async fetchItemsDefinitions(urns: string[]): Promise<(T | undefined)[]> {
      const definitionsByUrn: Map<string, T | undefined> = createLowerCaseKeysMap()
      const nonCachedURNs: string[] = []
      for (const urn of urns) {
        const definition = itemDefinitionsCache.get(urn)
        if (definition) {
          definitionsByUrn.set(urn, definition)
        } else {
          nonCachedURNs.push(urn)
        }
      }

      if (nonCachedURNs.length !== 0) {
        const entities = await content.fetchEntitiesByPointers(nonCachedURNs)
        for (const entity of entities) {
          const definition = entityMapper({ contentServerUrl }, entity)
          itemDefinitionsCache.set(definition.id, definition)
          definitionsByUrn.set(definition.id, definition)
        }
      }

      return urns.map((urn) => definitionsByUrn.get(urn))
    }
  }
}

export async function createWearableDefinitionsFetcherComponent(
  components: Pick<AppComponents, 'logs' | 'config' | 'content' | 'contentServerUrl'>
) {
  return createDefinitionsFetcherComponent<WearableDefinition>(components, extractWearableDefinitionFromEntity)
}

export async function createEmoteDefinitionsFetcherComponent(
  components: Pick<AppComponents, 'logs' | 'config' | 'content' | 'contentServerUrl'>
) {
  return createDefinitionsFetcherComponent<EmoteDefinition>(components, extractEmoteDefinitionFromEntity)
}
