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

async function fetchAssetsV2(
  { contentServerUrl, fetch }: Pick<AppComponents, 'contentServerUrl' | 'fetch' | 'logs' | 'metrics'>,
  linkedWearableProvider: ThirdPartyProvider
): Promise<Entity[]> {
  const urn = await parseUrn(linkedWearableProvider.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse linked wearable provider id: ${linkedWearableProvider.id}`)
  }

  const response = await fetch.fetch(`${contentServerUrl}/entities/active/collections/${linkedWearableProvider.id}`)
  const assetsByOwner: LinkedWearableAssetEntities = await response.json()
  return assetsByOwner.entities || []
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

export async function fetchUserThirdPartyAssets(
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
  collectionId: string
): Promise<ThirdPartyAsset[]> {
  const parts = collectionId.split(':')

  // TODO: [TPW] Use urn parser here
  if (!(parts.length === 5 || parts.length === 6)) {
    throw new Error(`Couldn't parse collectionId ${collectionId}, valid ones are like:
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}
    \n - urn:decentraland:{protocol}:collections-thirdparty:{third-party-name}:{collection-id}`)
  }

  const thirdPartyId = parts.slice(0, 5).join(':')

  const thirdPartyProviders = await components.thirdPartyProvidersStorage.getAll()
  const thirdPartyProvider: ThirdPartyProvider | undefined = thirdPartyProviders.find(
    (provider) => provider.id === thirdPartyId
  )

  if (!thirdPartyProvider) {
    return []
  }

  const thirdPartyWearables = await _fetchThirdPartyWearables(components, owner, [thirdPartyProvider])

  return thirdPartyWearables.map((tpw) => ({
    id: tpw.urn, // TODO check this, not sure id refers to full urn, it might be provider + collection id + item id
    amount: tpw.amount,
    urn: {
      decentraland: tpw.urn
    }
  }))
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
  async function fetchThirdPartyV2(linkedWearableProviders: ThirdPartyProvider[]) {
    if (linkedWearableProviders.length === 0) {
      return []
    }

    const contractAddresses = linkedWearableProviders.reduce(
      (carry, provider) => {
        ;(provider.metadata.thirdParty.contracts || []).forEach((contract) => {
          carry[contract.network] = carry[contract.network] || new Set<string>()
          carry[contract.network].add(contract.address)
        })
        return carry
      },
      {} as Record<string, Set<string>>
    )

    const nfts = await components.alchemyNftFetcher.getNFTsForOwner(owner, contractAddresses)

    const providersThatReturnedNfts = new Set<string>()
    for (const nft of nfts) {
      const [network, contractAddress] = nft.split(':')
      const providers = linkedWearableProviders.filter((provider) =>
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

    const providersToCheck = linkedWearableProviders.filter((provider) => providersThatReturnedNfts.has(provider.id))

    const linkedWearableEntities = (
      await Promise.all(providersToCheck.map((provider: ThirdPartyProvider) => fetchAssetsV2(components, provider)))
    ).flat()

    const assignedLinkedWearables: Record<string, { individualData: string[]; entity: Entity }> = {}
    for (const entity of linkedWearableEntities) {
      const urn = entity.metadata.id
      if (!entity.metadata.mappings) {
        continue
      }

      const mappingsHelper = createMappingsHelper(entity.metadata.mappings)
      for (const nft of nfts) {
        const [network, contract, tokenId] = nft.split(':')
        if (mappingsHelper.includesNft(network as ContractNetwork, contract, tokenId)) {
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
  const providersV2 = thirdParties.filter((provider) => (provider.metadata.thirdParty.contracts?.length ?? 0) > 0)

  const thirdPartyV2 = await fetchThirdPartyV2(providersV2)

  const thirdPartyWearablesByUrn = thirdPartyV2.reduce(
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
