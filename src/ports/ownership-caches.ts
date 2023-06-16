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

  const wearablesSize = parseInt((await config.getString('WEARABLES_CACHE_MAX_SIZE')) ?? '10000')
  const wearablesAge = parseInt((await config.getString('WEARABLES_CACHE_MAX_AGE')) ?? '300000')
  const namesSize = parseInt((await config.getString('NAMES_CACHE_MAX_SIZE')) ?? '10000')
  const namesAge = parseInt((await config.getString('NAMES_CACHE_MAX_AGE')) ?? '300000')
  const tpwSize = parseInt((await config.getString('THIRD_PARTY_CACHE_MAX_SIZE')) ?? '10000')
  const tpwAge = parseInt((await config.getString('THIRD_PARTY_CACHE_MAX_AGE')) ?? '300000')

  const wearablesCache: LRU<string, Map<string, boolean>> = new LRU({ max: wearablesSize, ttl: wearablesAge })
  const namesCache: LRU<string, Map<string, boolean>> = new LRU({ max: namesSize, ttl: namesAge })
  const tpwCache: LRU<string, Map<string, boolean>> = new LRU({ max: tpwSize, ttl: tpwAge })

  return {
    wearablesCache,
    namesCache,
    tpwCache
  }
}
