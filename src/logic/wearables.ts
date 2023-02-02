import {
  AppComponents,
  ProfileMetadata,
  wearableFromQuery,
  wearablesQueryResponse,
  wearableForResponse,
  ThirdPartyAsset,
  Definition
} from '../types'
import { parseUrn } from '@dcl/urn-resolver'
import { runQuery, TheGraphComponent } from '../ports/the-graph'
import {
  transformThirdPartyAssetToResponseSchema,
  transformWearableToResponseSchema
} from '../adapters/query-to-response'
import { cloneDeep } from 'lodash'
import { getThirdPartyWearables } from './third-party-wearables'
import LRU from 'lru-cache'
import { Entity, EntityType } from '@dcl/schemas'

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
  const filteredWearables = wearablesInProfile.filter((wearableId): wearableId is string => !!wearableId)
  return filteredWearables
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
{
  nfts(
    where: { owner: "$owner", category: "wearable"},
    orderBy: transferredAt,
    orderDirection: desc,
  ) {
    urn,
    id,
    contractAddress,
    tokenId,
    image,
    transferredAt,
    item {
      metadata {
        wearable {
          name,
          description
        }
      },
      rarity,
      price
    }
  }
}`

export async function getWearablesForAddress(
  components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch' | 'content'>,
  id: string,
  includeTPW: boolean,
  includeDefinitions: boolean,
  pageSize?: string | null,
  pageNum?: string | null,
  orderBy?: string | null
) {
  const { wearablesCaches } = components

  // Retrieve wearables for id from cache. They are stored sorted by creation date
  const dclWearables = await retrieveWearablesFromCache(
    wearablesCaches.dclWearablesCache,
    id,
    components,
    getDCLWearablesToBeCached
  )

  // Retrieve third-party wearables for id from cache
  let tpWearables: wearableForResponse[] = []
  if (includeTPW)
    tpWearables = await retrieveWearablesFromCache(
      wearablesCaches.thirdPartyWearablesCache,
      id,
      components,
      getThirdPartyWearablesToBeCached
    )

  // Concatenate both types of wearables
  let allWearables = [...tpWearables, ...dclWearables]

  // Set total amount of wearables
  const wearablesTotal = allWearables.length

  // Sort them by another field if specified
  if (orderBy === 'rarity') allWearables = cloneDeep(allWearables).sort(compareByRarity)

  // Virtually paginate the response if required
  if (pageSize && pageNum)
    allWearables = allWearables.slice(
      (parseInt(pageNum) - 1) * parseInt(pageSize),
      parseInt(pageNum) * parseInt(pageSize)
    )

  // Fetch for definitions, add it to the cache and add it to each wearable in the response
  if (includeDefinitions) allWearables = await decorateWearablesWithDefinitionsFromCache(allWearables, components)

  return {
    wearables: allWearables,
    totalAmount: wearablesTotal
  }
}

async function retrieveWearablesFromCache(
  wearablesCache: LRU<string, wearableForResponse[]>,
  id: string,
  components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch'>,
  getWearablesToBeCached: (
    id: string,
    components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch'>,
    theGraph: TheGraphComponent
  ) => Promise<wearableForResponse[]>
) {
  // Try to get them from cache
  let allWearables = wearablesCache.get(id)

  // If it was a miss, a queries are done and the merged response is stored
  if (!allWearables) {
    // Get wearables
    allWearables = await getWearablesToBeCached(id, components, components.theGraph)

    // Store the in the cache
    wearablesCache.set(id, allWearables)
  }
  return allWearables
}

async function getDCLWearablesToBeCached(id: string, components: Pick<AppComponents, 'theGraph' | 'fetch'>) {
  const { theGraph } = components

  // Set query
  const query = QUERY_WEARABLES.replace('$owner', id.toLowerCase())

  // Query owned wearables from TheGraph for the address
  const collectionsWearables = await runQuery<wearablesQueryResponse>(theGraph.collectionsSubgraph, query, {}).then(
    (response) => response.nfts
  )
  const maticWearables = await runQuery<wearablesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {}).then(
    (response) => response.nfts
  )

  // Merge the wearables responses, sort them by transferred date and group them by urn
  return groupWearablesByURN(collectionsWearables.concat(maticWearables)).sort(compareByTransferredAt)
}

async function getThirdPartyWearablesToBeCached(id: string, components: Pick<AppComponents, 'theGraph' | 'fetch'>) {
  // Get all third-party wearables
  const tpWearables = await getThirdPartyWearables(components, id)

  // Group third-party wearables by urn
  return groupThirdPartyWearablesByURN(tpWearables)
}

/*
 * Groups every wearable with the same URN. Each of them has some data which differentiates them as individuals.
 * That data is stored in an array binded to the corresponding urn. Returns an array of wearables in the response format.
 */
function groupWearablesByURN(wearables: wearableFromQuery[]): wearableForResponse[] {
  // Initialize the map
  const wearablesByURN = new Map<string, wearableForResponse>()

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
      wearablesByURN.set(wearable.urn, transformWearableToResponseSchema(wearable))
    }
  })

  // Return the contents of the map as an array
  return Array.from(wearablesByURN.values())
}

/*
 * Groups every third-party wearable with the same URN. Each of them could have a different id.
 * which is stored in an array binded to the corresponding urn. Returns an array of wearables in the response format.
 */
function groupThirdPartyWearablesByURN(tpWearables: ThirdPartyAsset[]): wearableForResponse[] {
  // Initialize the map
  const wearablesByURN = new Map<string, wearableForResponse>()

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
      wearablesByURN.set(wearable.urn.decentraland, transformThirdPartyAssetToResponseSchema(wearable))
    }
  })

  // Return the contents of the map as an array
  return Array.from(wearablesByURN.values())
}

/*
 * Returns a positive number if wearable1 is older than wearable2, zero if they are equal, and a negative
 * number if wearable2 is older than wearable1. Can be used to sort wearables by creationDate, descending
 */
function compareByTransferredAt(wearable1: wearableForResponse, wearable2: wearableForResponse) {
  // TMP SOLUTION
  if (
    wearable1.individualData &&
    wearable1.individualData[0].transferredAt &&
    wearable2.individualData &&
    wearable2.individualData[0].transferredAt
  )
    return wearable2.individualData[0].transferredAt - wearable1.individualData[0].transferredAt
  else return 0
}

/*
 * Returns a positive number if wearable1 has a lower rarity than wearable2, zero if they are equal, and a negative
 * number if wearable2 has a lower rarity than wearable1. Can be used to sort wearables by rarity, descending
 */
function compareByRarity(wearable1: wearableForResponse, wearable2: wearableForResponse) {
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique']
  const w1RarityValue = rarities.findIndex((rarity) => rarity === wearable1.rarity)
  const w2RarityValue = rarities.findIndex((rarity) => rarity === wearable2.rarity)
  return w2RarityValue - w1RarityValue
}

/*
 * Looks for the definitions of the provided wearables' urns and add them to them.
 */
export async function decorateWearablesWithDefinitionsFromCache(
  wearables: wearableForResponse[],
  components: Pick<AppComponents, 'content' | 'wearablesCaches'>
) {
  const { definitionsCache } = components.wearablesCaches

  // Try to get them from cache. If present add them to the map, if not add them to an array to fetch later
  const notCachedURNs: string[] = []
  const definitionsByURN = new Map<string, Definition>()
  wearables.forEach((wearable) => {
    const definition = definitionsCache.get(wearable.urn)
    if (definition) definitionsByURN.set(wearable.urn, definition)
    else notCachedURNs.push(wearable.urn)
  })

  // Fetch entities for non-cached urns
  const entities: Entity[] = await components.content.fetchEntitiesByPointers(EntityType.WEARABLE, notCachedURNs)

  // Translate entities to definitions
  const translatedDefinitions: Definition[] = entities.map((entity) => {
    const metadata = entity.metadata
    const representations = metadata.data.representations.map((representation: any) =>
      mapRepresentation(components, representation, entity)
    )
    const externalImage = createExternalContentUrl(components, entity, metadata.image)
    const thumbnail = createExternalContentUrl(components, entity, metadata.thumbnail)!
    const image = externalImage ?? metadata.image

    return {
      ...metadata,
      thumbnail,
      image,
      data: {
        ...metadata.data,
        representations
      }
    }
  })

  // Store new definitions in cache and in map
  translatedDefinitions.forEach((definition) => {
    definitionsCache.set(definition.id.toLowerCase(), definition)
    definitionsByURN.set(definition.id.toLowerCase(), definition)
  })

  console.log({ definitionsByURN })
  // Decorate provided wearables with definitions
  return wearables.map((wearable) => {
    return {
      ...wearable,
      definition: definitionsByURN.get(wearable.urn)
    }
  })
}

function mapRepresentation<T>(
  components: Pick<AppComponents, 'content'>,
  metadataRepresentation: T & { contents: string[] },
  entity: Entity
): T & { contents: { key: string; url: string }[] } {
  const newContents = metadataRepresentation.contents.map((fileName) => ({
    key: fileName,
    url: createExternalContentUrl(components, entity, fileName)!
  }))
  return {
    ...metadataRepresentation,
    contents: newContents
  }
}

function createExternalContentUrl(
  components: Pick<AppComponents, 'content'>,
  entity: Entity,
  fileName: string | undefined
): string | undefined {
  const hash = findHashForFile(entity, fileName)
  if (hash) return components.content.getExternalContentServerUrl() + `/contents/` + hash
  return undefined
}

function findHashForFile(entity: Entity, fileName: string | undefined) {
  if (fileName) return entity.content?.find((item) => item.file === fileName)?.hash
  return undefined
}
