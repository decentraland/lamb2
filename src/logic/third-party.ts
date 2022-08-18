import { EthAddress, WearableId, EntityType, Entity } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { AppComponents } from '../types'
import { runQuery } from './ownership'

const QUERY_THIRD_PARTY_RESOLVER = `
query ThirdPartyResolver($id: String!) {
  thirdParties(where: {id: $id, isApproved: true}) {
    id
    resolver
  }
}
`

export interface TPWResolver {
  findWearablesByOwner: (owner: EthAddress) => Promise<WearableId[]>
}

export type ThirdPartyAsset = {
  id: string
  amount: number
  urn: {
    decentraland: string
  }
}

export type ThirdPartyAssets = {
  address: EthAddress
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

export type Wearable = Omit<WearableMetadata, 'data'> & { data: WearableData }

type WearableData = Omit<WearableMetadataData, 'representations'> & { representations: WearableRepresentation[] }

export type WearableRepresentation = Omit<WearableMetadataRepresentation, 'contents'> & {
  contents: { key: string; url: string }[]
}

export type WearableMetadata = {
  id: WearableId
  description: string
  thumbnail: string
  image?: string
  collectionAddress?: EthAddress
  rarity: string
  i18n: I18N[]
  data: WearableMetadataData
  metrics?: Metrics
  createdAt: number
  updatedAt: number
}

export type WearableMetadataRepresentation = {
  bodyShapes: string[]
  mainFile: string
  contents: string[]
  overrideHides: string[]
  overrideReplaces: string[]
}

export type I18N = {
  code: string
  text: string
}

type WearableMetadataData = {
  replaces: string[]
  hides: string[]
  tags: string[]
  representations: WearableMetadataRepresentation[]
  category: string
}

type Metrics = {
  triangles: number
  materials: number
  textures: number
  meshes: number
  bodies: number
  entities: number
}

/*
 * It could happen that a user had a third-party wearable in its profile which it was
 * selled through the blockchain without being reflected on the content server, so we 
 * need to make sure that every third-party wearable it is still owned by the user.
 * This method gets the collection ids from a wearableIdsByAddress map, for each of them
 * gets its API resolver, gets the owned third party wearables for that collection, and
 * finally sanitize wearableIdsByAddress with the owned wearables.
 */
export async function ownedThirdPartyWearables(components: Pick<AppComponents, "theGraph" | "fetch" | "content">, wearableIdsByAddress: Map<string, string[]>): Promise<Map<string, string[]>> {
  const response = new Map()
  for (const [address, wearableIds] of wearableIdsByAddress) {

    // Get collectionIds from all wearables
    const collectionIds = await filterCollectionIdsFromWearables(wearableIds)

    // Get all owned TPW for every collectionId
    const ownedTPW: Set<string> = new Set()
    for (const collectionId of collectionIds) {
        // Get API for collection
        const resolver = await createThirdPartyResolverForCollection(components, collectionId)

        // Get owned wearables for the collection
        const ownedTPWForCollection = await getOwnedTPW(components, address, resolver)

        // Add wearables for collection to all owned wearables set
        for (const tpw of ownedTPWForCollection)
          ownedTPW.add(tpw.urn)
    } 

    // Filter the wearables from the map with the actually owned wearables
    const sanitizedWearables = wearableIds.filter((tpw) => ownedTPW.has(tpw))

    // Add wearables to final response
    response.set(address, sanitizedWearables)

  }
  return response
}

async function filterCollectionIdsFromWearables(wearableIds: string[]): Promise<string[]> {
  const collectionIds: string[] = []
  for (const wearableId of wearableIds) {
      try {
          const parsedUrn = await parseUrn(wearableId)
          if (parsedUrn?.type === 'blockchain-collection-third-party') {
              const collectionId = parsedUrn.uri.toString().split(':').slice(0, -1).join(':')
              collectionIds.push(collectionId)
          }
      } catch (error) {
          console.debug(`There was an error parsing the urn: ${wearableId}`)
      }
  }
  return collectionIds
}

async function createThirdPartyResolverForCollection(components: Pick<AppComponents, "theGraph" | "fetch">, collectionId: string): Promise<TPWResolver> {
  // Parse collection Id
  const { thirdPartyId, registryId } = parseCollectionId(collectionId)

  // Get resolver
  const thirdPartyResolverAPI = await findThirdPartyResolver(components, thirdPartyId)
  if (!thirdPartyResolverAPI) throw new Error(`Could not find third party resolver for collectionId: ${collectionId}`)

  return {
    findWearablesByOwner: async (owner) => {
      const assetsByOwner = await fetchAssets(components, thirdPartyResolverAPI, registryId, owner)
      if (!assetsByOwner) throw new Error(`Could not fetch assets for owner: ${owner}`)
      return (
        assetsByOwner
          ?.filter((asset) => asset.urn.decentraland.startsWith(thirdPartyId))
          .map((asset) => asset.urn.decentraland) ?? []
      )
    }
  }
}


// urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
// urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}
function parseCollectionId(collectionId: string): { thirdPartyId: string, registryId: string} {
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
 * This method returns the third party resolver API to be used to query assets from any collection
 * of given third party integration
 */
async function findThirdPartyResolver(components: Pick<AppComponents, "theGraph">, id: string): Promise<string | undefined> {
  const queryResponse = await runQuery<{ thirdParties: [{ resolver: string }] }>(components.theGraph.thirdPartyRegistrySubgraph, QUERY_THIRD_PARTY_RESOLVER, { id })
  return queryResponse.thirdParties[0]?.resolver
}

async function fetchAssets(components: Pick<AppComponents, "fetch">, thirdPartyResolverURL: string, registryId: string, owner: string) {
  let baseUrl: string | undefined = buildRegistryOwnerUrl(thirdPartyResolverURL, registryId, owner)
  const allAssets: ThirdPartyAsset[] = []

  try {
    do {
      const response = await components.fetch.fetch(baseUrl)
      const assetsByOwner = (await response.json()) as ThirdPartyAssets
      if (!assetsByOwner) {
        console.error(`No assets found with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} at ${baseUrl}`)
        break
      }

      for (const asset of assetsByOwner?.assets ?? []) {
        allAssets.push(asset)
      }

      baseUrl = assetsByOwner.next
    } while (baseUrl)

    return allAssets
  } catch (e) {
    console.error(e)
    throw new Error(
      `Error fetching assets with owner: ${owner}, url: ${thirdPartyResolverURL} and registryId: ${registryId} (${baseUrl})`
    )
  }
}

function buildRegistryOwnerUrl(thirdPartyResolverURL: string, registryId: string, owner: string): string {
  const baseUrl = new URL(thirdPartyResolverURL).href.replace(/\/$/, '')
  return `${baseUrl}/registry/${registryId}/address/${owner}/assets`
}

async function getOwnedTPW(components: Pick<AppComponents, "content">, owner: string, resolver: TPWResolver): Promise<{ urn: string; amount: number; definition?: Wearable | undefined }[]> {
  // Fetch wearables and definitions
  const wearablesByOwner = await resolver.findWearablesByOwner(owner)
  const wearablesById: Map<WearableId, Wearable> = await fetchDefinitions(components, wearablesByOwner)

  // Count wearables by user
  const count: Map<WearableId, number> = new Map()
  for (const wearableId of wearablesByOwner) {
    const amount = count.get(wearableId) ?? 0
    count.set(wearableId, amount + 1)
  }

  // Return result
  return Array.from(count.entries()).map(([id, amount]) => ({
    urn: id,
    amount,
    definition: wearablesById.get(id.toLowerCase())
  }))
}
async function fetchDefinitions(components: Pick<AppComponents, "content">, wearableIds: string[]): Promise<Map<string, Wearable>> {
  const wearables = await fetchWearables(components, wearableIds)
  return new Map(wearables.map((wearable) => [wearable.id.toLowerCase(), wearable]))
}

async function fetchWearables(components: Pick<AppComponents, "content">, wearableIds: string[]): Promise<Wearable[]> {
  if (wearableIds.length === 0) {
    return []
  }
  const entities = await components.content.fetchEntitiesByPointers(EntityType.WEARABLE, wearableIds)
  const wearables = entities.map((entity) => translateEntityIntoWearable(components, entity))
  return wearables.sort((wearable1, wearable2) => wearable1.id.toLowerCase().localeCompare(wearable2.id.toLowerCase()))
}

export function translateEntityIntoWearable(components: Pick<AppComponents, "content">, entity: Entity): Wearable {
  const metadata: WearableMetadata = entity.metadata!
  const representations = metadata.data.representations.map((representation) => mapRepresentation(components, representation, entity))
  const image = createExternalContentUrl(components, entity, metadata.image)
  const thumbnail = createExternalContentUrl(components, entity, metadata.thumbnail)!

  return {
    ...metadata,
    image,
    thumbnail,
    data: {
      ...metadata.data,
      representations
    }
  }
}

function mapRepresentation(components: Pick<AppComponents, "content">, metadataRepresentation: WearableMetadataRepresentation, entity: Entity): WearableRepresentation {
  const newContents = metadataRepresentation.contents.map((fileName) => ({
    key: fileName,
    url: createExternalContentUrl(components, entity, fileName)!
  }))
  return {
    ...metadataRepresentation,
    contents: newContents
  }
}

function createExternalContentUrl(components: Pick<AppComponents, "content">, entity: Entity, fileName: string | undefined): string | undefined {
  const hash = findHashForFile(entity, fileName)
  if (hash)
    return components.content.getExternalContentServerUrl() + `/contents/` + hash
  
  return undefined
}

export function findHashForFile(entity: Entity, fileName: string | undefined) {
  if (fileName)
    return entity.content?.find((item) => item.file === fileName)?.hash
  
  return undefined
}
