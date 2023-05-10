import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import { Entity } from '@dcl/schemas'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import { createLowerCaseKeysMap } from './lowercase-keys-map'

export type EntitiesFetcher = IBaseComponent & {
  fetchEntities(urns: string[]): Promise<(Entity | undefined)[]>
}

export async function createEntitiesFetcherComponent({
  config,
  content
}: Pick<AppComponents, 'logs' | 'config' | 'content'>): Promise<EntitiesFetcher> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 10000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  const entititesCache = createLowerCaseKeysCache<Entity>({ max: itemsSize, ttl: itemsAge })

  return {
    async fetchEntities(urns: string[]): Promise<(Entity | undefined)[]> {
      const entitiesByUrn: Map<string, Entity> = createLowerCaseKeysMap()
      const nonCachedURNs: string[] = []
      for (const urn of urns) {
        const definition = entititesCache.get(urn)
        if (definition) {
          entitiesByUrn.set(urn, definition)
        } else {
          nonCachedURNs.push(urn)
        }
      }

      if (nonCachedURNs.length !== 0) {
        const entities = await content.fetchEntitiesByPointers(nonCachedURNs)
        for (const entity of entities) {
          entititesCache.set(entity.metadata.id, entity)
          entitiesByUrn.set(entity.metadata.id, entity)
        }
      }

      return urns.map((urn) => entitiesByUrn.get(urn))
    }
  }
}
