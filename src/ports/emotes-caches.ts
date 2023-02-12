import { AppComponents, Definition } from '../types'
import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'

export type EmotesCachesComponent = IBaseComponent & {
  definitionsCache: LRU<string, Definition>
}

export async function createEmotesCachesComponent(
  components: Pick<AppComponents, 'config'>
): Promise<EmotesCachesComponent> {
  const { config } = components

  const emotesSize = parseInt((await config.getString('EMOTES_CACHE_MAX_SIZE')) ?? '1000')
  const emotesAge = parseInt((await config.getString('EMOTES_CACHE_MAX_AGE')) ?? '600000') // 10 minutes by default

  const definitionsCache: LRU<string, Definition> = new LRU({ max: emotesSize, ttl: emotesAge })

  async function start() {}

  async function stop() {}

  return {
    definitionsCache,
    start,
    stop
  }
}
