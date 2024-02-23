import { HandlerContextWithPath } from '../../types'
import { GetCollections200 } from '@dcl/catalyst-api-specs/lib/client'

export const BASE_AVATARS_COLLECTION_ID = 'urn:decentraland:off-chain:base-avatars'
export const BASE_EMOTES_COLLECTION_ID = 'urn:decentraland:off-chain:base-emotes'

const QUERY_COLLECTIONS = `
  {
    collections (first: 1000, orderBy: urn, orderDirection: asc) {
      urn,
      name,
    }
  }`

export async function allCollectionsHandler(
  context: HandlerContextWithPath<'theGraph' | 'config' | 'fetch' | 'ownershipCaches', '/nfts/collections'>
): Promise<{ status: 200; body: GetCollections200 }> {
  const { theGraph } = context.components

  function getL1Collections() {
    return theGraph.ethereumCollectionsSubgraph.query<{
      collections: { name: string; urn: string }[]
    }>(QUERY_COLLECTIONS, {})
  }

  function getL2Collections() {
    return theGraph.maticCollectionsSubgraph.query<{
      collections: { name: string; urn: string }[]
    }>(QUERY_COLLECTIONS, {})
  }

  const [l1Collections, l2Collections] = await Promise.all([getL1Collections(), getL2Collections()])

  const onChainCollections = l1Collections.collections
    .concat(l2Collections.collections)
    .map(({ urn, name }) => ({ id: urn, name }))

  const collections = [
    {
      id: BASE_AVATARS_COLLECTION_ID,
      name: 'Base Wearables'
    },
    {
      id: BASE_EMOTES_COLLECTION_ID,
      name: 'Base Emotes'
    },
    ...onChainCollections
  ]

  return {
    status: 200,
    body: { collections }
  }
}
