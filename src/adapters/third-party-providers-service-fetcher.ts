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
  mumbai: 'https://third-party-providers-resolver.decentraland.zone',
  amoy: 'https://third-party-providers-resolver.decentraland.zone'
}

export async function createThirdPartyProvidersServiceFetcherComponent(
  { config, fetch }: Pick<AppComponents, 'config' | 'fetch'>,
  l2Network: L2Network
): Promise<ThirdPartyProvidersServiceFetcher> {
  const serviceUrl = SERVICE_URL_DICTIONARY[l2Network]
  const isThirdPartyProvidersResolverServiceDisabled: boolean =
    (await config.getString('DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE')) === 'true'

  async function get(): Promise<ThirdPartyProvider[]> {
    if (isThirdPartyProvidersResolverServiceDisabled) {
      throw new Error(
        'Third Party Providers resolver service will not be used since DISABLE_THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_USAGE is set'
      )
    }
    const response: ThirdPartyProvidersServiceResponse = await (await fetch.fetch(`${serviceUrl}/providers`)).json()

    for (const thirdParty of response.thirdPartyProviders) {
      if (thirdParty.metadata.thirdParty.contracts) {
        thirdParty.metadata.thirdParty.contracts = thirdParty.metadata.thirdParty.contracts.map((c) => ({
          network: c.network.toLowerCase(),
          address: c.address.toLowerCase()
        }))
      }
    }

    return response.thirdPartyProviders
  }

  return {
    get
  }
}
