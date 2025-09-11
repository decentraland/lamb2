import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import { Entity } from '@dcl/schemas'
import { createLowerCaseKeysCache } from './lowercase-keys-cache'
import { createLowerCaseKeysMap } from './lowercase-keys-map'

/**
 * Response structure from content server collection endpoints
 */
type LinkedWearableAssetEntities = {
  total: number
  entities: Entity[]
}

/**
 * Minimal collection data for caching (URN + mappings only)
 */
type CollectionEntityReference = {
  entityUrn: string
  mappings: any
}

type CollectionCacheData = {
  entities: CollectionEntityReference[]
  isComplete: boolean
}

export type EntitiesFetcher = IBaseComponent & {
  fetchEntities(urns: string[]): Promise<(Entity | undefined)[]>
  fetchCollectionEntities(collectionId: string): Promise<Entity[]>
}

const MAX_COLLECTION_PAGE_SIZE = 1000

export async function createEntitiesFetcherComponent({
  config,
  content,
  logs,
  contentServerUrl,
  fetch
}: Pick<AppComponents, 'logs' | 'config' | 'content' | 'contentServerUrl' | 'fetch'>): Promise<EntitiesFetcher> {
  const itemsSize = (await config.getNumber('ITEMS_CACHE_MAX_SIZE')) ?? 10000
  const itemsAge = (await config.getNumber('ITEMS_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  const collectionCacheSize = (await config.getNumber('COLLECTION_CACHE_MAX_SIZE')) ?? 20
  const collectionCacheAge = (await config.getNumber('COLLECTION_CACHE_MAX_AGE')) ?? 86400000 // 24 hours

  const entititesCache = createLowerCaseKeysCache<Entity>({ max: itemsSize, ttl: itemsAge })
  const collectionsCache = createLowerCaseKeysCache<CollectionCacheData>({
    max: collectionCacheSize,
    ttl: collectionCacheAge
  })

  const logger = logs.getLogger('entities-fetcher')

  async function fetchCollectionPagination(
    collectionId: string,
    pageNum: number = 1
  ): Promise<LinkedWearableAssetEntities | undefined> {
    const url = `${contentServerUrl}/entities/active/collections/${collectionId}?pageSize=${MAX_COLLECTION_PAGE_SIZE}&pageNum=${pageNum}`
    const response = await fetch.fetch(url)
    if (!response.ok) {
      return response.status === 404
        ? {
            total: 0,
            entities: []
          }
        : undefined
    }

    return await response.json()
  }

  async function _fetchEntities(urns: string[]): Promise<(Entity | undefined)[]> {
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

  return {
    async fetchEntities(urns: string[]): Promise<(Entity | undefined)[]> {
      return _fetchEntities(urns)
    },

    async fetchCollectionEntities(collectionId: string): Promise<Entity[]> {
      const cachedResult = collectionsCache.get(collectionId)
      if (cachedResult && cachedResult.isComplete) {
        const entityUrns = cachedResult.entities.map((ref) => ref.entityUrn)
        const fullEntities = await _fetchEntities(entityUrns)

        return fullEntities.filter((entity): entity is Entity => entity !== undefined)
      }

      try {
        const firstResult = await fetchCollectionPagination(collectionId)
        if (!firstResult) {
          return [] // gracefully return an empty array
        }

        const totalEntities = firstResult.total
        const totalPages = Math.ceil(totalEntities / MAX_COLLECTION_PAGE_SIZE)
        const allEntities: Entity[] = []
        allEntities.push(...firstResult.entities)
        let complete = true

        if (totalPages > 1) {
          // fetch all the rest of pages in parallel
          const remainingPageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
          console.log('remainingPageNumbers', remainingPageNumbers)
          const remainingResults = await Promise.all(
            remainingPageNumbers.map(async (pageNum) => {
              return await fetchCollectionPagination(collectionId, pageNum)
            })
          )

          for (const result of remainingResults) {
            if (result) {
              allEntities.push(...result.entities)
            } else {
              complete = false
            }
          }
        }

        // remove entities without mappings
        const entitiesWithMappings = allEntities.filter((entity) => entity.metadata.mappings)
        const minimalCacheData: CollectionCacheData = {
          entities: entitiesWithMappings.map((entity) => ({
            entityUrn: entity.metadata.id,
            mappings: entity.metadata.mappings
          })),
          isComplete: complete
        }

        // store minimal data in cache { urn, mappings }
        collectionsCache.set(collectionId, minimalCacheData)

        return entitiesWithMappings
      } catch (error) {
        logger.error('Parallel pagination failed for collection', {
          collectionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        return []
      }
    }
  }
}
