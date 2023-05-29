import { IBaseComponent } from '@well-known-components/interfaces'
import { BaseComponents } from '../types'
import { getCatalystServersFromDAO } from 'dcl-catalyst-client/dist/contracts'
import { CatalystServerInfo } from 'dcl-catalyst-client/dist/types'
import { About } from '@dcl/catalyst-api-specs/lib/client'

export type IRealmNameComponent = IBaseComponent & {
  getValidatedRealmName(): Promise<string | undefined>
}

export async function createRealmNameComponent(
  components: Pick<BaseComponents, 'fetch' | 'config' | 'provider'>
): Promise<IRealmNameComponent> {
  const { config, fetch, provider } = components

  async function resolveRealmName({ address }: CatalystServerInfo): Promise<string | undefined> {
    const response = await fetch.fetch(`${address}/about`)
    if (!response.ok) {
      return undefined
    }

    try {
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

    const network = (await config.getString('ETH_NETWORK')) ?? 'mainnet'
    const servers = await getCatalystServersFromDAO(network as any, provider)
    const names = new Set(await Promise.all(servers.map(resolveRealmName)))

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
