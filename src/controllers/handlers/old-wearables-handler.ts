import { AppComponents, ThirdPartyAsset, TPWResolver, HandlerContextWithPath } from '../../types'
import { runQuery, TheGraphComponent } from '../../ports/the-graph'
import { cloneDeep } from 'lodash'
import LRU from 'lru-cache'
import { Entity, I18N } from '@dcl/schemas'

import { IBaseComponent } from '@well-known-components/interfaces'

type UrnAndAmount = {
  urn: string
  amount: number
}

type WearableFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  item: {
    rarity: string
    price: number
  }
}

type ThirdPartyProvider = {
  id: string
  resolver: string
}

type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

type ThirdPartyResolversResponse = {
  thirdParties: ThirdPartyProvider[]
}

type WearableForCache = {
  urn: string
  amount: number
  individualData?: {
    id: string
    tokenId?: string
    transferredAt?: number
    price?: number
  }[]
  rarity?: string // Rarity added in the cache to being able to sort by it. It wont be included in the response since it already appears in the definition. It's optional because third-party wearables doesn't have rarity
}

type WearablesQueryResponse = {
  nfts: WearableFromQuery[]
}

type Definition = {
  id: string
  description: string
  image: string
  thumbnail: string
  collectionAddress: string
  rarity: string
  createdAt: number
  updatedAt: number
  data: {
    replaces: string[]
    hides: string[]
    tags: string[]
    category: string
    representations: Representation[]
  }
  i18n: I18N[]
}

type Representation = {
  bodyShapes: string[]
  mainFile: string
  overrideReplaces: string[]
  overrideHides: string[]
  contents: Content[]
}

type Content = {
  key: string
  url: string
}

type WearableForResponse = {
  urn: string
  amount: number
  individualData?: {
    id: string
    tokenId?: string
    transferredAt?: number
    price?: number
  }[]
  definition?: Definition
}

export type WearablesCachesComponent = IBaseComponent & {
  dclWearablesCache: LRU<string, WearableForResponse[]>
  thirdPartyWearablesCache: LRU<string, WearableForResponse[]>
  definitionsCache: LRU<string, Definition>
}

export async function createWearablesCachesComponent(
  components: Pick<AppComponents, 'config'>
): Promise<WearablesCachesComponent> {
  const { config } = components

  const wearablesSize = parseInt((await config.getString('WEARABLES_CACHE_MAX_SIZE')) ?? '1000')
  const wearablesAge = parseInt((await config.getString('WEARABLES_CACHE_MAX_AGE')) ?? '600000') // 10 minutes by default

  const dclWearablesCache: LRU<string, WearableForResponse[]> = new LRU({ max: wearablesSize, ttl: wearablesAge })
  const thirdPartyWearablesCache: LRU<string, WearableForResponse[]> = new LRU({
    max: wearablesSize,
    ttl: wearablesAge
  })
  const definitionsCache: LRU<string, Definition> = new LRU({ max: wearablesSize, ttl: wearablesAge })

  async function start() {}

  async function stop() {}

  return {
    dclWearablesCache,
    thirdPartyWearablesCache,
    definitionsCache,
    start,
    stop
  }
}

async function createThirdPartyResolverForCollection(
  components: Pick<AppComponents, 'theGraph' | 'fetch'>,
  collectionId: string
): Promise<TPWResolver> {
  // Parse collection Id
  const { thirdPartyId, registryId } = parseCollectionId(collectionId)

  // Get resolver
  const thirdPartyResolverAPI = await findThirdPartyResolver(components, thirdPartyId)
  if (!thirdPartyResolverAPI) throw new Error(`Could not find third party resolver for collectionId: ${collectionId}`)

  return {
    findThirdPartyAssetsByOwner: async (owner) => {
      const assetsByOwner = await fetchAssets(components, thirdPartyResolverAPI, registryId, owner)
      if (!assetsByOwner) throw new Error(`Could not fetch assets for owner: ${owner}`)
      return assetsByOwner?.filter((asset) => asset.urn.decentraland.startsWith(thirdPartyId)) ?? []
    }
  }
}

export async function oldWearablesHandler(
  context: HandlerContextWithPath<
    'config' | 'theGraph' | 'wearablesCaches' | 'fetch' | 'content',
    '/nfts/wearables/:id'
  >
) {
  // Get request params
  const { id } = context.params
  const includeTPW = context.url.searchParams.has('includeThirdParty')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pageSize = context.url.searchParams.get('pageSize')
  const pageNum = context.url.searchParams.get('pageNum')
  const orderBy = context.url.searchParams.get('orderBy')
  const collectionId = context.url.searchParams.get('collectionId')

  let wearablesResponse
  if (collectionId) {
    // If collectionId is present, only that collection third-party wearables are sent
    wearablesResponse = await getWearablesForCollection(context.components, collectionId, id, includeDefinitions)
  } else {
    // Get full cached wearables response
    wearablesResponse = await getWearablesForAddress(
      context.components,
      id,
      includeTPW,
      includeDefinitions,
      pageSize,
      pageNum,
      orderBy
    )
  }

  return {
    status: 200,
    body: {
      wearables: wearablesResponse.wearables,
      totalAmount: wearablesResponse.totalAmount,
      pageNum: pageNum,
      pageSize: pageSize
    }
  }
}

function parseCollectionId(collectionId: string): { thirdPartyId: string; registryId: string } {
  const parts = collectionId.split(':')

  // TODO: [TPW] Use urn parser here
  if (!(parts.length === 5 || parts.length === 6)) {
    throw new Error(`Couldn't parse collectionId ${collectionId}, valid ones are like:
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}`)
  }

  return {
    thirdPartyId: parts.slice(0, 5).join(':'),
    registryId: parts[4]
  }
}

/**
 * Returns the third party resolver API to be used to query assets from any collection
 * of given third party integration
 */
async function findThirdPartyResolver(
  components: Pick<AppComponents, 'theGraph'>,
  id: string
): Promise<string | undefined> {
  const queryResponse = await runQuery<{ thirdParties: [{ resolver: string }] }>(
    components.theGraph.thirdPartyRegistrySubgraph,
    QUERY_THIRD_PARTY_RESOLVER,
    { id }
  )
  return queryResponse.thirdParties[0]?.resolver
}

const QUERY_THIRD_PARTY_RESOLVER = `
query ThirdPartyResolver($id: String!) {
  thirdParties(where: {id: $id, isApproved: true}) {
    id,
    resolver
  }
}
`

async function fetchAssets(
  components: Pick<AppComponents, 'fetch'>,
  thirdPartyResolverURL: string,
  registryId: string,
  owner: string
) {
  let baseUrl: string | undefined = buildRegistryOwnerUrl(thirdPartyResolverURL, registryId, owner)
  const allAssets: ThirdPartyAsset[] = []
  try {
    do {
      const response = await components.fetch.fetch(baseUrl, { timeout: 5000 })
      const responseVal = await response.json()
      const assetsByOwner = responseVal as ThirdPartyAssets
      if (!assetsByOwner) {
        console.error(
          `No assets found with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} at ${baseUrl}`
        )
        break
      }

      for (const asset of assetsByOwner?.assets ?? []) {
        allAssets.push(asset)
      }

      baseUrl = assetsByOwner.next
    } while (baseUrl)

    return allAssets
  } catch (err) {
    console.error(
      `Error fetching assets with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} (${baseUrl}). ${err}`
    )
    return []
  }
}

function buildRegistryOwnerUrl(thirdPartyResolverURL: string, registryId: string, owner: string): string {
  const baseUrl = new URL(thirdPartyResolverURL).href.replace(/\/$/, '')
  return `${baseUrl}/registry/${registryId}/address/${owner}/assets`
}

/*
 * Returns all third-party wearables for an address
 */
async function getThirdPartyWearables(components: Pick<AppComponents, 'theGraph' | 'fetch'>, userAddress: string) {
  const { theGraph } = components

  // Get every resolver
  const tpProviders = (
    await runQuery<ThirdPartyResolversResponse>(
      theGraph.thirdPartyRegistrySubgraph,
      QUERY_ALL_THIRD_PARTY_RESOLVERS,
      {}
    )
  ).thirdParties

  // Fetch assets asynchronously
  const providersPromises = tpProviders.map((provider: ThirdPartyProvider) => {
    return fetchAssets(components, provider.resolver, parseCollectionId(provider.id).registryId, userAddress)
  })

  return (await Promise.all(providersPromises)).flat()
}

const QUERY_ALL_THIRD_PARTY_RESOLVERS = `
{
  thirdParties(where: {isApproved: true}) {
    id,
    resolver
  }
}
`

/*
 * Returns only third-party wearables for the specified collection id, owned by the provided address
 */
async function getWearablesForCollection(
  components: Pick<AppComponents, 'theGraph' | 'fetch' | 'wearablesCaches' | 'content'>,
  collectionId: string,
  address: string,
  includeDefinitions: boolean
) {
  const { definitionsCache } = components.wearablesCaches

  // Get API for collection
  const resolver = await createThirdPartyResolverForCollection(components, collectionId)

  // Get owned wearables for the collection
  let ownedTPWForCollection = (await resolver.findThirdPartyAssetsByOwner(address)).map(
    transformThirdPartyAssetToWearableForCache
  )

  // Fetch for definitions, add it to the cache and add it to each wearable in the response
  if (includeDefinitions)
    ownedTPWForCollection = await decorateNFTsWithDefinitionsFromCache(
      ownedTPWForCollection,
      components,
      definitionsCache,
      extractWearableDefinitionFromEntity
    )

  return {
    wearables: ownedTPWForCollection,
    totalAmount: ownedTPWForCollection.length
  }
}

/*
 * Adapts the result from the wearables query to the desired schema for the cache
 */
function transformWearableFromQueryToWearableForCache(wearable: WearableFromQuery): WearableForCache {
  return {
    urn: wearable.urn,
    individualData: [
      {
        id: wearable.id,
        tokenId: wearable.tokenId,
        transferredAt: wearable.transferredAt,
        price: wearable.item.price
      }
    ],
    rarity: wearable.item.rarity,
    amount: 1
  }
}

/*
 * Excludes the rarity field since it's already present in the definition field
 */
function transformWearableForCacheToWearableForResponse(wearable: WearableForCache): WearableForResponse {
  return {
    urn: wearable.urn,
    individualData: wearable.individualData,
    amount: wearable.amount
  }
}

/*
 * Adapts the response from a third-party resolver to /nfts/wearables endpoint response
 */
function transformThirdPartyAssetToWearableForCache(asset: ThirdPartyAsset): WearableForCache {
  return {
    urn: asset.urn.decentraland,
    individualData: [
      {
        id: asset.id
      }
    ],
    amount: 1
  }
}

function extractWearableDefinitionFromEntity(components: Pick<AppComponents, 'content'>, entity: Entity) {
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

/*
 * Looks for the definitions of the provided emotes' urns and add them to them.
 */
async function decorateNFTsWithDefinitionsFromCache(
  nfts: UrnAndAmount[],
  components: Pick<AppComponents, 'content'>,
  definitionsCache: LRU<string, Definition>,
  extractDefinitionFromEntity: (components: Pick<AppComponents, 'content'>, entity: Entity) => Definition
) {
  // Get a map with the definitions from the cache and an array with the non-cached urns
  const { nonCachedURNs, definitionsByURN } = getDefinitionsFromCache(nfts, definitionsCache)

  // Fetch entities for non-cached urns
  let entities: Entity[] = []
  if (nonCachedURNs.length !== 0) entities = await components.content.fetchEntitiesByPointers(nonCachedURNs)

  // Translate entities to definitions
  const translatedDefinitions: Definition[] = entities.map((entity) => extractDefinitionFromEntity(components, entity))

  // Store new definitions in cache and in map
  translatedDefinitions.forEach((definition) => {
    definitionsCache.set(definition.id.toLowerCase(), definition)
    definitionsByURN.set(definition.id.toLowerCase(), definition)
  })

  // Decorate provided nfts with definitions
  return nfts.map((nft) => {
    return {
      ...nft,
      definition: definitionsByURN.get(nft.urn)
    }
  })
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
    tokenId,
    transferredAt,
    item {
      rarity,
      price
    }
  }
}`

async function getWearablesForAddress(
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
  let tpWearables: WearableForCache[] = []
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

  // Transform wearables to the response schema (exclude rarity)
  let wearablesForResponse = allWearables.map(transformWearableForCacheToWearableForResponse)

  // Fetch for definitions, add it to the cache and add it to each wearable in the response
  if (includeDefinitions)
    wearablesForResponse = await decorateNFTsWithDefinitionsFromCache(
      wearablesForResponse,
      components,
      wearablesCaches.definitionsCache,
      extractWearableDefinitionFromEntity
    )

  return {
    wearables: wearablesForResponse,
    totalAmount: wearablesTotal
  }
}

async function retrieveWearablesFromCache(
  wearablesCache: LRU<string, WearableForResponse[]>,
  id: string,
  components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch'>,
  getWearablesToBeCached: (
    id: string,
    components: Pick<AppComponents, 'theGraph' | 'wearablesCaches' | 'fetch'>,
    theGraph: TheGraphComponent
  ) => Promise<WearableForCache[]>
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
  const collectionsWearables = await runQuery<WearablesQueryResponse>(
    theGraph.ethereumCollectionsSubgraph,
    query,
    {}
  ).then((response) => response.nfts)
  const maticWearables = await runQuery<WearablesQueryResponse>(theGraph.maticCollectionsSubgraph, query, {}).then(
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
 * Try to get the definitions from cache. Present ones are retrieved as a map urn -> definition.
 * Not present ones are retrieved as an array to fetch later
 */
function getDefinitionsFromCache(nfts: UrnAndAmount[], definitionsCache: LRU<string, Definition>) {
  const nonCachedURNs: string[] = []
  const definitionsByURN = new Map<string, Definition>()
  nfts.forEach((nft) => {
    const definition = definitionsCache.get(nft.urn)
    if (definition) {
      definitionsByURN.set(nft.urn, definition)
    } else {
      nonCachedURNs.push(nft.urn)
    }
  })

  return { nonCachedURNs, definitionsByURN }
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
