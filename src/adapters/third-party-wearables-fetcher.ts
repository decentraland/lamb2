import LRU from 'lru-cache'
import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, Limits, ThirdPartyAsset, ThirdPartyWearable } from '../types'

// TODO cache metrics

type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

export type ThirdPartyWearablesResult = {
  wearables: ThirdPartyWearable[]
  totalAmount: number
}

export type ThirdPartyWearablesFetcher = IBaseComponent & {
  // NOTE: the result will be always orderer by rarity
  fetchByOwner(address: string, limits: Limits): Promise<ThirdPartyWearablesResult>
}

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id,
    resolver
  }
}
`
// Example:
//   "thirdParties": [
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
//       "resolver": "https://decentraland-api.babydoge.com/v1"
//     },
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
//       "resolver": "https://api.cryptoavatars.io/"
//     },
//     {
//       "id": "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
//       "resolver": "https://wearables-api.unxd.com"
//     }
//  ]

type ThirdPartyResolversResponse = {
  thirdParties: ThirdParty[]
}

type ThirdParty = {
  id: string
  resolver: string
}

function groupThirdPartyWearablesByURN(assets: ThirdPartyAsset[]): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const asset of assets) {
    if (wearablesByURN.has(asset.urn.decentraland)) {
      const wearableFromMap = wearablesByURN.get(asset.urn.decentraland)!
      wearableFromMap.individualData.push({ id: asset.id })
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      wearablesByURN.set(asset.urn.decentraland, {
        urn: asset.urn.decentraland,
        individualData: [
          {
            id: asset.id
          }
        ],
        amount: 1
      })
    }
  }

  return Array.from(wearablesByURN.values())
}

export async function createThirdPartyWearablesFetcherComponent({
  config,
  logs,
  theGraph,
  fetch
}: Pick<AppComponents, 'fetch' | 'logs' | 'config' | 'theGraph'>): Promise<ThirdPartyWearablesFetcher> {
  const wearablesSize = (await config.getNumber('WEARABLES_CACHE_MAX_SIZE')) ?? 1000
  const wearablesAge = (await config.getNumber('WEARABLES_CACHE_MAX_AGE')) ?? 600000 // 10 minutes by default
  const logger = logs.getLogger('third-party-wearables-fetcher')

  const thirdPartiesCache = new LRU<number, ThirdParty[]>({
    max: 1,
    ttl: 1000 * 60 * 60 * 6, // 6 hours
    fetchMethod: async function (_: number, staleValue: ThirdParty[]) {
      try {
        const tpProviders = (
          await theGraph.thirdPartyRegistrySubgraph.query<ThirdPartyResolversResponse>(
            QUERY_ALL_THIRD_PARTY_RESOLVERS,
            {}
          )
        ).thirdParties
        return tpProviders
      } catch (err: any) {
        logger.error(err)
        return staleValue
      }
    }
  })

  async function fetchAssets(owner: string, thirdParty: ThirdParty) {
    const parts = thirdParty.id.split(':')
    if (parts.length !== 5) {
      throw new Error(`Couldn't parse third party id: ${thirdParty.id}`)
    }
    const registryId = parts[4]

    const baseUrl = new URL(thirdParty.resolver).href.replace(/\/$/, '')
    let url: string | undefined = `${baseUrl}/registry/${registryId}/address/${owner}/assets`

    const allAssets: ThirdPartyAsset[] = []
    try {
      do {
        const response = await fetch.fetch(url, { timeout: 5000 })
        if (!response.ok) {
          logger.error(`Http status ${response.status} from ${url}`)
          break
        }
        const responseVal = await response.json()
        const assetsByOwner = responseVal as ThirdPartyAssets
        if (!assetsByOwner) {
          logger.error(`No assets found with owner: ${owner}, url: ${url}`)
          break
        }

        for (const asset of assetsByOwner.assets ?? []) {
          allAssets.push(asset)
        }

        url = assetsByOwner.next
      } while (url)
    } catch (err) {
      logger.error(`Error fetching assets with owner: ${owner}, url: ${url}`)
    }

    return allAssets
  }

  const cache = new LRU<string, ThirdPartyWearable[]>({
    max: wearablesSize,
    ttl: wearablesAge,
    fetchMethod: async function (owner: string, _staleValue: ThirdPartyWearable[]) {
      const thirdParties = thirdPartiesCache.get(0)!

      // TODO: test if stateValue is keept in case of an exception
      const thirdPartyAssets = await Promise.all(
        thirdParties.map((thirdParty: ThirdParty) => fetchAssets(owner, thirdParty))
      )

      return groupThirdPartyWearablesByURN(thirdPartyAssets.flat())
    }
  })

  async function start() {
    await thirdPartiesCache.fetch(0)
  }

  async function fetchByOwner(address: string, { offset, limit }: Limits): Promise<ThirdPartyWearablesResult> {
    const results = await cache.fetch(address)
    if (!results) {
      // TODO: or should we throw instead?
      return {
        wearables: [],
        totalAmount: 0
      }
    }
    const totalAmount = results.length
    return {
      wearables: results.slice(offset, offset + limit),
      totalAmount
    }
  }

  return {
    start,
    fetchByOwner
  }
}
