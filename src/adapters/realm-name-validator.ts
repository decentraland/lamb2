import { IBaseComponent } from '@well-known-components/interfaces'
import { BaseComponents } from '../types'
import { About } from '@dcl/catalyst-api-specs/lib/client'

export type IRealmNameComponent = IBaseComponent & {
  getValidatedRealmName(): Promise<string | undefined>
}

export async function createRealmNameComponent(
  components: Pick<BaseComponents, 'fetch' | 'config' | 'catalystsFetcher' | 'logs'>
): Promise<IRealmNameComponent> {
  const { config, fetch, catalystsFetcher, logs } = components

  const logger = logs.getLogger('realm-name')

  async function resolveRealmName(baseUrl: string): Promise<string | undefined> {
    try {
      const response = await fetch.fetch(`${baseUrl}/about`)
      if (!response.ok) {
        return undefined
      }

      const data: About = await response.json()
      return data.configurations.realmName
    } catch (err) {
      return undefined
    }
  }

  let validatedRealmName: string | undefined = undefined
  async function getValidatedRealmName(): Promise<string | undefined> {
    if (validatedRealmName) {
      return validatedRealmName
    }

    const realmName = await config.getString('REALM_NAME')
    if (!realmName) {
      return undefined
    }

    const servers = await catalystsFetcher.getCatalystServers()
    const names = new Set(await Promise.all(servers.map((s) => resolveRealmName(s.baseUrl))))

    logger.log(`Realm names found: ${JSON.stringify(Array.from(names))}`)
    if (!names.has(realmName)) {
      validatedRealmName = realmName
      return realmName
    }

    return undefined
  }
  return {
    getValidatedRealmName
  }
}
