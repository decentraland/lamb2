import { L2Network } from '@dcl/catalyst-contracts'
import { AppComponents, ThirdPartyProvider } from '../types'

export type ThirdPartyProvidersServiceFetcher = {
  get(): Promise<ThirdPartyProvider[]>
}

type ThirdPartyProvidersServiceResponse = {
  thirdPartyProviders: ThirdPartyProvider[]
}

const SERVICE_URL_DICTIONARY = {
  polygon: 'https://third-party-providers-resolver.decentraland.org',
  mumbai: 'https://third-party-providers-resolver.decentraland.zone'
}

export async function createThirdPartyProvidersServiceFetcherComponent(
  { config, fetch }: Pick<AppComponents, 'config' | 'fetch'>,
  l2Network: L2Network
): Promise<ThirdPartyProvidersServiceFetcher> {
  const serviceUrl = SERVICE_URL_DICTIONARY[l2Network]
  const useServiceToFetchProviders: boolean =
    (await config.getString('USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE')) === 'true' ? true : false

  return {
    async get(): Promise<ThirdPartyProvider[]> {
      if (!useServiceToFetchProviders)
        throw new Error(
          'The environment variable USE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE must be set to fetch providers from service'
        )
      const response: ThirdPartyProvidersServiceResponse = await (await fetch.fetch(`${serviceUrl}/providers`)).json()
      return response.thirdPartyProviders
    }
  }
}
