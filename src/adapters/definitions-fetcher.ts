import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Definition } from '../types'
import { extractEmoteDefinitionFromEntity, extractWearableDefinitionFromEntity } from './definitions'

export type DefinitionsFetcher = IBaseComponent & {
  fetchWearablesDefinitions(urns: string[]): Promise<(Definition | undefined)[]>
  fetchEmotesDefinitions(urns: string[]): Promise<(Definition | undefined)[]>
}

export async function createDefinitionsFetcherComponent({
  config,
  content
}: Pick<AppComponents, 'logs' | 'config' | 'content'>): Promise<DefinitionsFetcher> {
  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) ?? 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default

  // TODO create lower case cache, get/set wrapped to set the key to lowercase
  const wearablesDefinitionsCache = new LRU<string, Definition>({
    max: wearablesSize,
    ttl: wearablesAge
  })

  async function fetchWearablesDefinitions(urns: string[]): Promise<(Definition | undefined)[]> {
    const nonCachedURNs: string[] = []
    for (const urn of urns) {
      const definition = wearablesDefinitionsCache.get(urn.toLowerCase())
      if (!definition) {
        nonCachedURNs.push(urn)
      }
    }

    if (nonCachedURNs.length !== 0) {
      const entities = await content.fetchEntitiesByPointers(nonCachedURNs)
      for (const entity of entities) {
        const definition = extractWearableDefinitionFromEntity({ content }, entity)
        wearablesDefinitionsCache.set(definition.id.toLowerCase(), definition)
      }
    }

    return urns.map((urn) => wearablesDefinitionsCache.get(urn.toLowerCase()))
  }

  async function fetchEmotesDefinitions(urns: string[]): Promise<(Definition | undefined)[]> {
    const nonCachedURNs: string[] = []
    for (const urn of urns) {
      const definition = wearablesDefinitionsCache.get(urn.toLowerCase())
      if (!definition) {
        nonCachedURNs.push(urn)
      }
    }

    if (nonCachedURNs.length !== 0) {
      const entities = await content.fetchEntitiesByPointers(nonCachedURNs)
      for (const entity of entities) {
        const definition = extractEmoteDefinitionFromEntity({ content }, entity)
        wearablesDefinitionsCache.set(definition.id.toLowerCase(), definition)
      }
    }

    return urns.map((urn) => wearablesDefinitionsCache.get(urn.toLowerCase()))
  }

  return {
    fetchWearablesDefinitions,
    fetchEmotesDefinitions
  }
}
