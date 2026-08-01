import { EmoteDefinition, Entity, WearableDefinition } from '@dcl/schemas'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import { extractEmoteDefinitionFromEntity, extractWearableDefinitionFromEntity } from './definitions'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import { createLowerCaseKeysMap } from './lowercase-keys-map'
import { fetchEntitiesInBatches } from '../logic/fetch-entities-in-batches'

export type DefinitionsFetcher<T extends WearableDefinition | EmoteDefinition> = IBaseComponent & {
  fetchItemsDefinitions(urns: string[]): Promise<(T | undefined)[]>
}

async function createDefinitionsFetcherComponent<T extends WearableDefinition | EmoteDefinition>(
  { config, content, contentServerUrl, logs }: Pick<AppComponents, 'logs' | 'config' | 'content' | 'contentServerUrl'>,
  entityMapper: (components: Pick<AppComponents, 'contentServerUrl'>, entity: Entity) => T
): Promise<DefinitionsFetcher<T>> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 10000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  const itemDefinitionsCache = createLowerCaseKeysCache<T>({ max: itemsSize, ttl: itemsAge })
  const logger = logs.getLogger('definitions-fetcher')

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
        const entities = await fetchEntitiesInBatches(
          nonCachedURNs,
          (batch, { abortController }) => content.fetchEntitiesByPointers(batch, { abortController }),
          logger
        )

        for (const entity of entities) {
          if (!entity?.metadata?.id) {
            logger.warn('Skipping entity without metadata id', { entityId: entity?.id ?? '<unknown>' })
            continue
          }

          try {
            const definition = entityMapper({ contentServerUrl }, entity)
            itemDefinitionsCache.set(definition.id, definition)
            definitionsByUrn.set(definition.id, definition)
          } catch (error) {
            // The mapper reads nested metadata, so one malformed entity must not cost the
            // definitions of every other item in the request.
            logger.warn('Skipping entity that could not be mapped to a definition', {
              entityId: entity.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
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
