import { transformThirdPartyAssetToWearableForCache } from '../adapters/nfts'
import { runQuery } from '../ports/the-graph'
import {
  AppComponents,
  ThirdPartyResolversResponse,
  ThirdPartyAsset,
  ThirdPartyAssets,
  TPWResolver,
  ThirdPartyProvider
} from '../types'
import { decorateWearablesWithDefinitionsFromCache } from './wearables'

export async function createThirdPartyResolverForCollection(
  components: Pick<AppComponents, 'theGraph' | 'fetch'>,
  collectionId: string
): Promise<TPWResolver> {
  // Parse collection Id
  const { thirdPartyId, registryId } = parseCollectionId(collectionId)

  // Get resolver
  const thirdPartyResolverAPI = await findThirdPartyResolver(components, thirdPartyId)
  if (!thirdPartyResolverAPI) throw new Error(`Could not find third party resolver for collectionId: ${collectionId}`)

  return {
    findWearablesByOwner: async (owner) => {
      const assetsByOwner = await fetchAssets(components, thirdPartyResolverAPI, registryId, owner)
      if (!assetsByOwner) throw new Error(`Could not fetch assets for owner: ${owner}`)
      return assetsByOwner?.filter((asset) => asset.urn.decentraland.startsWith(thirdPartyId)) ?? []
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
export async function getThirdPartyWearables(
  components: Pick<AppComponents, 'theGraph' | 'fetch'>,
  userAddress: string
) {
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
export async function getWearablesForCollection(
  components: Pick<AppComponents, 'theGraph' | 'fetch' | 'wearablesCaches' | 'content'>,
  collectionId: string,
  address: string,
  includeDefinitions: boolean
) {
  // Get API for collection
  const resolver = await createThirdPartyResolverForCollection(components, collectionId)

  // Get owned wearables for the collection
  let ownedTPWForCollection = (await resolver.findWearablesByOwner(address)).map(
    transformThirdPartyAssetToWearableForCache
  )

  // Fetch for definitions, add it to the cache and add it to each wearable in the response
  if (includeDefinitions)
    ownedTPWForCollection = await decorateWearablesWithDefinitionsFromCache(ownedTPWForCollection, components)

  return {
    wearables: ownedTPWForCollection,
    totalAmount: ownedTPWForCollection.length
  }
}
