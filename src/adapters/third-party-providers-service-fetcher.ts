import { AppComponents, ThirdPartyProvider } from '../types'

export type ThirdPartyProvidersServiceFetcher = {
  get(): Promise<ThirdPartyProvider[]>
}

type ThirdPartyProvidersServiceResponse = {
  thirdPartyProviders: ThirdPartyProvider[]
}

export async function createThirdPartyProvidersServiceFetcherComponent({
  config,
  fetch
}: Pick<AppComponents, 'config' | 'fetch'>): Promise<ThirdPartyProvidersServiceFetcher> {
  const thirdPartyProvidersServiceUrl: string | undefined = await config.getString(
    'THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL'
  )

  return {
    async get(): Promise<ThirdPartyProvider[]> {
      if (!thirdPartyProvidersServiceUrl)
        throw new Error(
          'Could not fetch Third Party Providers from service since the environment variable THIRD_PARTY_PROVIDERS_RESOLVER_SERVICE_URL is missing'
        )
      const response: ThirdPartyProvidersServiceResponse = await (
        await fetch.fetch(`${thirdPartyProvidersServiceUrl}/providers`)
      ).json()
      return response.thirdPartyProviders
    }
  }
}
