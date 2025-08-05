import { ContractNetwork, createMappingsHelper, Entity } from '@dcl/schemas'
import { BlockchainCollectionThirdPartyName, parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../adapters/elements-fetcher'
import { AppComponents, ThirdPartyAsset, ThirdPartyProvider, ThirdPartyWearable } from '../../types'

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

export type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

type LinkedWearableAssetEntities = {
  total: number
  entities: Entity[]
}

async function fetchAssetsRepresentation(
  { contentServerUrl, fetch }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs' | 'metrics'>,
  thirdPartyProvider: ThirdPartyProvider
): Promise<Entity[]> {
  const urn = await parseUrn(thirdPartyProvider.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse linked wearable provider id: ${thirdPartyProvider.id}`)
  }

  const response = await fetch.fetch(`${contentServerUrl}/entities/active/collections/${thirdPartyProvider.id}`)
  const assetsFromThirdPartyCollection: LinkedWearableAssetEntities = await response.json()
  return assetsFromThirdPartyCollection.entities || []
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
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'logs'
    | 'entitiesFetcher'
    | 'metrics'
  >,
  owner: string
): Promise<ThirdPartyWearable[]> {
  const thirdParties = await components.thirdPartyProvidersStorage.getAll()

  return await _fetchThirdPartyWearables(components, owner, thirdParties)
}

async function _fetchThirdPartyWearables(
  components: Pick<
    AppComponents,
    | 'alchemyNftFetcher'
    | 'contentServerUrl'
    | 'thirdPartyProvidersStorage'
    | 'fetch'
    | 'logs'
    | 'entitiesFetcher'
    | 'metrics'
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
        providersToCheck.map((provider: ThirdPartyProvider) => fetchAssetsRepresentation(components, provider))
      )
    ).flat()

    const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}
    for (const entity of thirdPartyEntities) {
      const urn = entity.metadata.id
      if (!entity.metadata.mappings) {
        continue
      }

      /** MappingHelper:
       * Contains the relation between the NFT token id and the Decentraland asset urn
       * Multiple token ids can refer to the same asset
       */
      const entityMappingHelper = createMappingsHelper(entity.metadata.mappings)
      for (const nft of ownedNftUrns) {
        const [network, contract, tokenId] = nft.split(':')
        if (entityMappingHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
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

  const { elements: allWearables } = await components.thirdPartyWearablesFetcher.fetchOwnedElements(address)

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
