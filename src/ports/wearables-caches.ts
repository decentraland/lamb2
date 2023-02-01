import { AppComponents, Definition, wearableForResponse } from '../types'
import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'

export type WearablesCachesComponent = IBaseComponent & {
  dclWearablesCache: LRU<string, wearableForResponse[]>
  thirdPartyWearablesCache: LRU<string, wearableForResponse[]>
  definitionsCache: LRU<string, Definition>
}

export async function createWearablesCachesComponent(
  components: Pick<AppComponents, 'config'>
): Promise<WearablesCachesComponent> {
  const { config } = components

  const wearablesSize = parseInt((await config.getString('WEARABLES_CACHE_MAX_SIZE')) ?? '1000')
  const wearablesAge = parseInt((await config.getString('WEARABLES_CACHE_MAX_AGE')) ?? '600000') // 10 minutes by default

  const dclWearablesCache: LRU<string, wearableForResponse[]> = new LRU({ max: wearablesSize, ttl: wearablesAge })
  const thirdPartyWearablesCache: LRU<string, wearableForResponse[]> = new LRU({
    max: wearablesSize,
    ttl: wearablesAge
  })
  const definitionsCache: LRU<string, Definition> = new LRU({ max: wearablesSize, ttl: wearablesAge })

  async function start() {}

  async function stop() {}

  return {
    dclWearablesCache,
    thirdPartyWearablesCache,
    definitionsCache,
    start,
    stop
  }
}
