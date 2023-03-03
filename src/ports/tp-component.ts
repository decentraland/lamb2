import { AppComponents, CachedThirdPartyWearable, CachedWearable, ThirdPartyProvider } from '../types'
import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { runQuery } from './the-graph'
import { fetchAssets, parseCollectionId } from '../logic/third-party-wearables'
import { transformThirdPartyAssetToWearableForCache } from '../adapters/nfts'

const sixHours = 1000 * 60 * 60 * 6

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id,
    resolver
  }
}
`

type ThirdPartyResolversResponse = {
  thirdParties: ThirdPartyProvider[]
}

export type ThirdPartyWearablesComponent = IBaseComponent & {
  fetchByOwner: (owner: string) => Promise<CachedThirdPartyWearable[]>
}

export async function createThirdPartyWearablesComponent({
  theGraph,
  config,
  logs,
  fetch
}: Pick<AppComponents, 'fetch' | 'config' | 'logs' | 'theGraph'>): Promise<ThirdPartyWearablesComponent> {
  const logger = logs.getLogger('third party wearables cache')

  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) || 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) || 600000 // 10 minutes by default

  const thirdPartyProvidersCache = new LRU<string, ThirdPartyProvider[]>({
    max: 1,
    ttl: sixHours,
    fetchMethod: async (_: string, staleValue: ThirdPartyProvider[]): Promise<ThirdPartyProvider[]> => {
      try {
        return (
          await runQuery<ThirdPartyResolversResponse>(
            theGraph.thirdPartyRegistrySubgraph,
            QUERY_ALL_THIRD_PARTY_RESOLVERS,
            {}
          )
        ).thirdParties
      } catch (err: any) {
        logger.warn(`Error retrieving third party providers ${err.message}`)
        return staleValue
      }
    }
  })

  const cache = new LRU<string, CachedThirdPartyWearable[]>({
    max: wearablesSize,
    ttl: wearablesAge,
    fetchMethod: async function (
      owner: string,
      _staleValue: CachedThirdPartyWearable[]
    ): Promise<CachedThirdPartyWearable[]> {
      const tpProviders = await thirdPartyProvidersCache.fetch('')
      const providersPromises = tpProviders!.map((provider: ThirdPartyProvider) => {
        return fetchAssets({ fetch }, provider.resolver, parseCollectionId(provider.id).registryId, owner)
      })

      const tpWearables = (await Promise.all(providersPromises)).flat()

      const wearablesByURN = new Map<string, CachedThirdPartyWearable>()

      // Set the map with the wearables data
      tpWearables.forEach((wearable) => {
        if (wearablesByURN.has(wearable.urn.decentraland)) {
          // The wearable was present in the map, its individual data is added to the individualData array for that wearable
          const wearableFromMap = wearablesByURN.get(wearable.urn.decentraland)!
          wearableFromMap?.individualData.push({
            id: wearable.id
          })
          wearableFromMap.amount = wearableFromMap.amount + 1
        } else {
          // The wearable was not present in the map, it is added and its individualData array is initialized with its data
          wearablesByURN.set(wearable.urn.decentraland, transformThirdPartyAssetToWearableForCache(wearable))
        }
      })

      // Return the contents of the map as an array
      return Array.from(wearablesByURN.values())
    }
  })

  async function start() {
    // NOTE: this ensures there is always at least a stale version of the third party providers in the cache
    await thirdPartyProvidersCache.fetch('')
  }

  async function fetchByOwner(owner: string): Promise<CachedThirdPartyWearable[]> {
    return (await cache.fetch(owner)) || []
  }

  return {
    fetchByOwner,
    start
  }
}
