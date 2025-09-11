import { Entity } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, ThirdPartyAsset, ThirdPartyProvider, ThirdPartyWearable } from '../../types'
import { filterByUserNfts, mappingComprehendsEntity } from '../linked-wearables-mapper'

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

export type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

async function fetchAssetsRepresentation(
  components: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'entitiesFetcher'>,
  thirdPartyProvider: ThirdPartyProvider,
  userOwnedNfts: string[]
): Promise<Entity[]> {
  const collectionId = thirdPartyProvider.id

  const urn = await parseUrn(collectionId)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse linked wearable provider id: ${collectionId}`)
  }

  // Fetch all entities with built-in caching and pagination
  const allEntities = await components.entitiesFetcher.fetchCollectionEntities(collectionId)

  // Filter and return only entities matching user's NFTs
  return filterByUserNfts(allEntities, userOwnedNfts)
}

function groupLinkedWearablesByURN(
  assets: Record<
    string,
    {
      individualData: string[]
      entity: Entity
    }
  >
): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const [assetId, data] of Object.entries(assets)) {
    wearablesByURN.set(assetId, {
      urn: assetId,
      individualData: data.individualData.map((indi) => ({
        id: `${assetId}:${indi}`,
        tokenId: indi
      })),
      amount: data.individualData.length,
      name: data.entity.metadata.name,
      category: data.entity.metadata.data.category,
      entity: data.entity
    })
  }
  return Array.from(wearablesByURN.values())
}

export async function fetchAllThirdPartyWearables(
  components: Pick<
    AppComponents,
    'alchemyNftFetcher' | 'contentServerUrl' | 'thirdPartyProvidersStorage' | 'fetch' | 'entitiesFetcher' | 'metrics'
  >,
  owner: string
): Promise<ThirdPartyWearable[]> {
  const thirdParties = await components.thirdPartyProvidersStorage.getAll()

  return await _fetchThirdPartyWearables(components, owner, thirdParties)
}

async function _fetchThirdPartyWearables(
  components: Pick<
    AppComponents,
    'alchemyNftFetcher' | 'contentServerUrl' | 'thirdPartyProvidersStorage' | 'fetch' | 'entitiesFetcher' | 'metrics'
  >,
  owner: string,
  thirdParties: ThirdPartyProvider[]
): Promise<ThirdPartyWearable[]> {
  async function fetchThirdPartyWearables(thirdPartyProviders: ThirdPartyProvider[]) {
    if (thirdPartyProviders.length === 0) {
      return []
    }

    const thirdPartyContractsByNetwork = thirdPartyProviders.reduce(
      (carry, provider) => {
        ;(provider.metadata.thirdParty.contracts || []).forEach((contract) => {
          carry[contract.network] = carry[contract.network] || new Set<string>()
          carry[contract.network].add(contract.address)
        })
        return carry
      },
      {} as Record<string, Set<string>>
    )

    const ownedNftUrns = await components.alchemyNftFetcher.getNFTsForOwner(owner, thirdPartyContractsByNetwork)
    const providersThatReturnedNfts = new Set<string>()
    for (const urn of ownedNftUrns) {
      const [network, contractAddress] = urn.split(':')
      const providers = thirdPartyProviders.filter((provider) =>
        (provider.metadata.thirdParty.contracts || []).find(
          (contract) => contract.network === network && contract.address === contractAddress
        )
      )
      if (providers.length > 0) {
        for (const provider of providers) {
          providersThatReturnedNfts.add(`${provider.id}`)
        }
      }
    }

    const providersToCheck = thirdPartyProviders.filter((provider) => providersThatReturnedNfts.has(provider.id))

    const thirdPartyEntities = (
      await Promise.all(
        providersToCheck.map((provider: ThirdPartyProvider) =>
          fetchAssetsRepresentation(components, provider, ownedNftUrns)
        )
      )
    ).flat()

    const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}

    // All entities are pre-filtered to match user's NFTs, now build individual NFT assignments
    for (const entity of thirdPartyEntities) {
      const urn = entity.metadata.id

      for (const nft of ownedNftUrns) {
        if (mappingComprehendsEntity(entity.metadata.mappings, nft)) {
          if (assignedLinkedWearables[urn]) {
            assignedLinkedWearables[urn].individualData.push(nft)
          } else {
            assignedLinkedWearables[urn] = { individualData: [nft], entity }
          }
        }
      }
    }

    return groupLinkedWearablesByURN(assignedLinkedWearables)
  }

  const providers = thirdParties.filter((provider) => (provider.metadata.thirdParty.contracts?.length ?? 0) > 0)

  const thirdPartyWearables = await fetchThirdPartyWearables(providers)

  const thirdPartyWearablesByUrn = thirdPartyWearables.reduce(
    (acc, tpw) => {
      // If there are repeated wearables, we should merge them
      acc[tpw.urn] = tpw
      return acc
    },
    {} as Record<string, ThirdPartyWearable>
  )
  return Object.values(thirdPartyWearablesByUrn)
}

export async function fetchThirdPartyWearablesFromThirdPartyName(
  components: Pick<AppComponents, 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersStorage' | 'fetch'>,
  address: string,
  thirdPartyNameUrn: BlockchainCollectionThirdPartyName
): Promise<ThirdPartyWearable[]> {
  const results: ThirdPartyWearable[] = []

  const allWearables = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)

  if (allWearables) {
    for (const wearable of allWearables) {
      const wearableUrn = await parseUrn(wearable.urn)
      if (
        wearableUrn &&
        wearableUrn.type === URN_THIRD_PARTY_ASSET_TYPE &&
        wearableUrn.thirdPartyName === thirdPartyNameUrn.thirdPartyName
      ) {
        results.push(wearable)
      }
    }
  }

  const thirdParty = await components.thirdPartyProvidersStorage.get(thirdPartyNameUrn)

  if (!thirdParty) {
    // NOTE: currently lambdas return an empty array with status code 200 for this case
    throw new FetcherError(`Third Party not found: ${thirdPartyNameUrn.thirdPartyName}`)
  }

  return results
}
