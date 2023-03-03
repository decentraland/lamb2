import {
  AppComponents,
  Pagination,
  ProfileMetadata,
  ThirdPartyAsset,
  WearableForCache,
  WearableForResponse,
  WearableFromQuery,
  WearablesQueryResponse
} from '../types'
import { parseUrn } from '@dcl/urn-resolver'
import { runQuery } from '../ports/the-graph'
import {
  transformThirdPartyAssetToWearableForCache,
  transformWearableForCacheToWearableForResponse,
  transformWearableFromQueryToWearableForCache
} from '../adapters/nfts'
import { getThirdPartyWearables } from './third-party-wearables'
import LRU from 'lru-cache'
import { EntityType } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../adapters/definitions'
import { decorateNFTsWithDefinitionsFromCache } from './definitions'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'

const THE_GRAPH_PAGE_SIZE = 1000

/*
 * Extracts the non-base wearables from a profile and translate them to the new format
 */
export async function getValidNonBaseWearables(metadata: ProfileMetadata): Promise<string[]> {
  const wearablesInProfile: string[] = []
  for (const avatar of metadata.avatars) {
    for (const wearableId of avatar.avatar.wearables) {
      if (!isBaseWearable(wearableId)) {
        const translatedWearableId = await translateWearablesIdFormat(wearableId)
        if (translatedWearableId) wearablesInProfile.push(translatedWearableId)
      }
    }
  }
  return wearablesInProfile.filter((wearableId) => !!wearableId)
}

/*
 * Filters base wearables from a wearables array and translate them to the new id format
 */
export async function getBaseWearables(wearables: string[]): Promise<string[]> {
  // Filter base wearables
  const baseWearables = wearables.filter(isBaseWearable)

  // Translate old format ones to the new id format
  const validBaseWearables = []
  for (const wearableId of baseWearables) {
    const translatedWearableId = await translateWearablesIdFormat(wearableId)
    if (translatedWearableId) validBaseWearables.push(translatedWearableId)
  }

  return validBaseWearables
}

function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}

/*
 * Translates from the old id format into the new one
 */
export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
  if (!wearableId.startsWith('dcl://')) return wearableId

  const parsed = await parseUrn(wearableId)
  return parsed?.uri?.toString()
}

const QUERY_WEARABLES: string = `
  query fetchWearablesByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "wearable"},
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      urn,
      id,
      tokenId,
      category
      transferredAt,
      item {
        rarity,
        price
      }
    }
  }`

async function runWearablesQuery(subgraph: ISubgraphComponent, owner: string) {
  const nfts = []

  owner = owner.toLowerCase()
  let idFrom = ''
  let result: WearablesQueryResponse
  do {
    result = await runQuery<WearablesQueryResponse>(subgraph, QUERY_WEARABLES, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      nfts.push(nft)
    }

    idFrom = nfts[nfts.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return nfts
}

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch' | 'content' | 'logs'>,
  address: string,
  includeTPW: boolean,
  includeDefinitions: boolean,
  pagination: Pagination
) {
  const { theGraph, logs, wearablesCaches } = components
  const logger = logs.getLogger('wearables')

  // Retrieve wearables for address from cache. They are stored sorted by creation date
  const dclWearables = await retrieveWearablesFromCache(
    wearablesCaches.dclWearablesCache,
    address,
    async function getDCLWearablesToBeCached(owner: string) {
      // Query owned wearables from TheGraph for the address
      const [collectionsWearables, maticWearables] = await Promise.all([
        runWearablesQuery(theGraph.collectionsSubgraph, owner),
        runWearablesQuery(theGraph.maticCollectionsSubgraph, owner)
      ])

      logger.debug(
        `${collectionsWearables.length} ethereum wearables and ${maticWearables.length} matic wearables retrieved from subgraph`
      )

      // Merge the wearables responses, sort them by transferred date and group them by urn
      return groupWearablesByURN(collectionsWearables.concat(maticWearables)).sort(compareByTransferredAt)
    }
  )
  logger.debug(`${dclWearables.length} dcl wearables retrieved from cache`)

  // Retrieve third-party wearables for address from cache
  let tpWearables: WearableForCache[] = []
  if (includeTPW) {
    tpWearables = await retrieveWearablesFromCache(
      wearablesCaches.thirdPartyWearablesCache,
      address,
      async function getThirdPartyWearablesToBeCached(owner: string) {
        // Get all third-party wearables
        const tpWearables = await getThirdPartyWearables(components, owner)

        // Group third-party wearables by urn
        return groupThirdPartyWearablesByURN(tpWearables)
      }
    )
    logger.debug(`${tpWearables.length} tp wearables retrieved from cache`)
  }

  // Concatenate both types of wearables
  let allWearables = [...tpWearables, ...dclWearables]

  // Set total amount of wearables
  const wearablesTotal = allWearables.length

  // Sort them by another field if specified
  if (pagination.orderBy === 'rarity') {
    allWearables = Array.from(allWearables).sort(compareByRarity)
  }

  // Virtually paginate the response if required
  if (pagination.pageSize && pagination.pageNum)
    allWearables = allWearables.slice(
      (pagination.pageNum - 1) * pagination.pageSize,
      pagination.pageNum * pagination.pageSize
    )

  // Transform wearables to the response schema (exclude rarity)
  let wearablesForResponse = allWearables.map(transformWearableForCacheToWearableForResponse)

  // Fetch for definitions, add it to the cache and add it to each wearable in the response
  if (includeDefinitions)
    wearablesForResponse = await decorateNFTsWithDefinitionsFromCache(
      wearablesForResponse,
      components,
      wearablesCaches.definitionsCache,
      EntityType.WEARABLE,
      extractWearableDefinitionFromEntity
    )

  return {
    wearables: wearablesForResponse,
    totalAmount: wearablesTotal
  }
}

async function retrieveWearablesFromCache(
  wearablesCache: LRU<string, WearableForResponse[]>,
  owner: string,
  getWearablesToBeCached: (owner: string) => Promise<WearableForCache[]>
) {
  // Try to get them from cache
  let allWearables = wearablesCache.get(owner)

  // If it was a miss, a queries are done and the merged response is stored
  if (!allWearables) {
    // Get wearables
    allWearables = await getWearablesToBeCached(owner)

    // Store the in the cache
    wearablesCache.set(owner, allWearables)
  }
  return allWearables
}

/*
 * Groups every wearable with the same URN. Each of them has some data which differentiates them as individuals.
 * That data is stored in an array binded to the corresponding urn. Returns an array of wearables in the response format.
 */
function groupWearablesByURN(wearables: WearableFromQuery[]): WearableForCache[] {
  // Initialize the map
  const wearablesByURN = new Map<string, WearableForCache>()

  // Set the map with the wearables data
  wearables.forEach((wearable) => {
    if (wearablesByURN.has(wearable.urn)) {
      // The wearable was present in the map, its individual data is added to the individualData array for that wearable
      const wearableFromMap = wearablesByURN.get(wearable.urn)!
      wearableFromMap?.individualData?.push({
        id: wearable.id,
        tokenId: wearable.tokenId,
        transferredAt: wearable.transferredAt,
        price: wearable.item.price
      })
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      // The wearable was not present in the map, it is added and its individualData array is initialized with its data
      wearablesByURN.set(wearable.urn, transformWearableFromQueryToWearableForCache(wearable))
    }
  })

  // Return the contents of the map as an array
  return Array.from(wearablesByURN.values())
}

/*
 * Groups every third-party wearable with the same URN. Each of them could have a different id.
 * which is stored in an array binded to the corresponding urn. Returns an array of wearables in the response format.
 */
function groupThirdPartyWearablesByURN(tpWearables: ThirdPartyAsset[]): WearableForCache[] {
  // Initialize the map
  const wearablesByURN = new Map<string, WearableForCache>()

  // Set the map with the wearables data
  tpWearables.forEach((wearable) => {
    if (wearablesByURN.has(wearable.urn.decentraland)) {
      // The wearable was present in the map, its individual data is added to the individualData array for that wearable
      const wearableFromMap = wearablesByURN.get(wearable.urn.decentraland)!
      wearableFromMap?.individualData?.push({
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

/*
 * Returns a positive number if wearable1 is older than wearable2, zero if they are equal, and a negative
 * number if wearable2 is older than wearable1. Can be used to sort wearables by creationDate, descending
 */
function compareByTransferredAt(wearable1: WearableForResponse, wearable2: WearableForResponse) {
  if (
    wearable1.individualData &&
    wearable1.individualData[0].transferredAt &&
    wearable2.individualData &&
    wearable2.individualData[0].transferredAt
  )
    return wearable2.individualData[0].transferredAt - wearable1.individualData[0].transferredAt
  else return 0
}

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']

/*
 * Returns a positive number if wearable1 has a lower rarity than wearable2, zero if they are equal, and a negative
 * number if wearable2 has a lower rarity than wearable1. Can be used to sort wearables by rarity, descending.
 * It is only aplicable when definitions are being include in the response, if it's not include it will return 0.
 */
function compareByRarity(wearable1: WearableForCache, wearable2: WearableForCache) {
  if (wearable1.rarity && wearable2.rarity) {
    const w1RarityValue = RARITIES.findIndex((rarity) => rarity === wearable1.rarity)
    const w2RarityValue = RARITIES.findIndex((rarity) => rarity === wearable2.rarity)
    return w2RarityValue - w1RarityValue
  }
  return 0
}
