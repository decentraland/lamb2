import { IBaseComponent } from '@well-known-components/interfaces'
import LRUCache from 'lru-cache'
import { BaseComponents } from '../types'

export type ServiceStatus<T> = {
  healthy: boolean
  data?: T
}

export type IStatusComponent = IBaseComponent & {
  getServiceStatus<T>(statusUrl: string): Promise<ServiceStatus<T>>
}

export async function createStatusComponent(
  components: Pick<BaseComponents, 'fetch' | 'logs'>
): Promise<IStatusComponent> {
  const { fetch, logs } = components

  const logger = logs.getLogger('status-component')

  const cache = new LRUCache<string, any>({
    max: 3,
    ttl: 1000 * 60, // 1min
    fetchMethod: async function (url: string): Promise<any> {
      try {
        const response = await fetch.fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        })
        if (!response.ok) {
          return undefined
        }
        return response.json()
      } catch (err: any) {
        logger.error(err)
        return undefined
      }
    }
  })

  async function getServiceStatus<T>(statusURL: string): Promise<ServiceStatus<T>> {
    const data = await cache.fetch(statusURL)
    if (!data) {
      return { healthy: false }
    }

    return { healthy: true, data }
  }

  return {
    getServiceStatus
  }
}
