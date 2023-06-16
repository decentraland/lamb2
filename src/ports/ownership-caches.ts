import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents } from '../types'
import LRU from 'lru-cache'

export type OwnershipCachesComponent = IBaseComponent & {
  wearablesCache: LRU<string, Map<string, boolean>>
  namesCache: LRU<string, Map<string, boolean>>
  tpwCache: LRU<string, Map<string, boolean>>
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

  const wearablesCache: LRU<string, Map<string, boolean>> = new LRU({ max: wearablesSize, ttl: wearablesAge })
  const namesCache: LRU<string, Map<string, boolean>> = new LRU({ max: namesSize, ttl: namesAge })
  const tpwCache: LRU<string, Map<string, boolean>> = new LRU({ max: tpwSize, ttl: tpwAge })

  return {
    wearablesCache,
    namesCache,
    tpwCache
  }
}
