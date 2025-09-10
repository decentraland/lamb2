import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import LRU from 'lru-cache'

export type LinkedWearableEntityReference = {
  entityUrn: string
  mappings: any
}

export type OwnershipCachesComponent = IBaseComponent & {
  wearablesCache: LRU<string, Map<string, boolean>>
  namesCache: LRU<string, Map<string, boolean>>
  tpwCache: LRU<string, Map<string, boolean>>
  tpwEntitiesCache: LRU<string, LinkedWearableEntityReference[]>
}

export async function createOwnershipCachesComponent(
  components: Pick<AppComponents, 'config'>
): Promise<OwnershipCachesComponent> {
  const { config } = components

  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) || 10_000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) || 300_000
  const namesSize = (await config.getNumber('NAMES_CACHE_MAX_SIZE')) || 10_000
  const namesAge = (await config.getNumber('NAMES_CACHE_MAX_AGE')) || 300_000
  const tpwSize = (await config.getNumber('THIRD_PARTY_CACHE_MAX_SIZE')) || 10_000
  const tpwAge = (await config.getNumber('THIRD_PARTY_CACHE_MAX_AGE')) || 300_000
  const tpwEntitiesSize = (await config.getNumber('COLLECTION_ENTITIES_CACHE_MAX_SIZE')) || 50
  const tpwEntitiesAge = (await config.getNumber('COLLECTION_ENTITIES_CACHE_TTL')) || 86400000 // 24 hours

  const wearablesCache: LRU<string, Map<string, boolean>> = new LRU({ max: wearablesSize, ttl: wearablesAge })
  const namesCache: LRU<string, Map<string, boolean>> = new LRU({ max: namesSize, ttl: namesAge })
  const tpwCache: LRU<string, Map<string, boolean>> = new LRU({ max: tpwSize, ttl: tpwAge })
  const tpwEntitiesCache: LRU<string, LinkedWearableEntityReference[]> = new LRU({
    max: tpwEntitiesSize,
    ttl: tpwEntitiesAge
  })

  return {
    wearablesCache,
    namesCache,
    tpwCache,
    tpwEntitiesCache
  }
}
