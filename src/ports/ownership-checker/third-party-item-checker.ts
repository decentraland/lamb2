import RequestManager, { ContractFactory, HTTPProvider, RPCSendableMessage, toData } from 'eth-connect'
import { BlockchainCollectionThirdPartyItem, parseUrn } from '@dcl/urn-resolver'
import { ContractType, ThirdPartyContractRegistry } from './third-party-contract-registry'
import { erc1155Abi, erc721Abi, sendBatch } from './contract-helpers'
import { AppComponents } from '../../types'
import { ContractNetwork, createMappingsHelper, Entity } from '@dcl/schemas'

type TempData = {
  urn: string
  assetUrn?: string
  network?: string
  contract?: string
  nftId?: string
  type?: ContractType
  result?: boolean
}
export type ThirdPartyItemChecker = {
  checkThirdPartyItems(ethAddress: string, itemUrns: string[]): Promise<boolean[]>
}

const EMPTY_MESSAGE = '0x'

export async function createThirdPartyItemChecker(
  { entitiesFetcher, logs }: Pick<AppComponents, 'entitiesFetcher' | 'logs'>,
  provider: HTTPProvider,
  thirdPartyContractRegistry: ThirdPartyContractRegistry
): Promise<ThirdPartyItemChecker> {
  const logger = logs.getLogger('item-checker')
  const requestManager = new RequestManager(provider)
  const erc721ContractFactory = new ContractFactory(requestManager, erc721Abi)
  const erc1155ContractFactory = new ContractFactory(requestManager, erc1155Abi)

  async function checkThirdPartyItems(ethAddress: string, itemUrns: string[]): Promise<boolean[]> {
    if (itemUrns.length === 0) {
      logger.debug('No third party items to check')
      return []
    }

    logger.info(`Checking third party items for ${ethAddress}: ${JSON.stringify(itemUrns)}`)

    const allUrns: Record<string, any> = itemUrns.reduce(
      (acc, urn) => {
        acc[urn] = { urn }
        return acc
      },
      {} as Record<string, TempData>
    )
    console.log('allUrn', allUrns)

    // Mark as false all urns that cannot be parsed
    for (const urn of itemUrns) {
      const parsed = await parseUrn(urn)
      if (!parsed) {
        allUrns[urn].result = false
      } else {
        const thirdPartyItem = parsed as BlockchainCollectionThirdPartyItem
        allUrns[urn].network = thirdPartyItem.nftChain.toLowerCase()
        allUrns[urn].contract = thirdPartyItem.nftContractAddress.toLowerCase()
        allUrns[urn].nftId = thirdPartyItem.nftTokenId
        allUrns[urn].assetUrn = urn.split(':').slice(0, 7).join(':')
      }
    }

    // Fetch wearables from the content server for check the mappings are valid.
    const entitiesToFetch = new Set<string>(
      Object.values(allUrns)
        .map((tempData: TempData) => tempData.assetUrn ?? '')
        .filter((assetUrn: string) => !!assetUrn)
    )
    const entities = await entitiesFetcher.fetchEntities(Array.from(entitiesToFetch))
    const entitiesByPointer = entities.reduce(
      (acc, entity: Entity | undefined) => {
        if (entity?.metadata) {
          acc[entity.metadata.id] = entity
        }
        return acc
      },
      {} as Record<string, Entity>
    )

    // Mark as false all items with invalid mapping
    Object.values(allUrns)
      .filter((tempData) => !tempData.result)
      .forEach((tempData) => {
        if (!entitiesByPointer[tempData.assetUrn!]) {
          tempData.result = false
        }
        const entity = entitiesByPointer[tempData.assetUrn!]
        const mappingsHelper = createMappingsHelper(entity.metadata.mappings)
        if (!mappingsHelper.includesNft(tempData.network! as ContractNetwork, tempData.contract!, tempData.nftId!)) {
          tempData.result = false
        }
      })
    console.log('allUrn after filtering invalid mappings', allUrns)

    // Ensure all contracts are of a known type, otherwise try to determine it and store it.
    await thirdPartyContractRegistry.ensureContractsKnown(
      Object.values(allUrns)
        .filter((tempData) => !!tempData.contract)
        .map((asset) => asset.contract)
    )

    // Mark as false all contracts that are of unknown type
    Object.values(allUrns)
      .filter((tempData) => !!tempData.contract)
      .forEach((tempData) => {
        if (!tempData.result && thirdPartyContractRegistry.isUnknown(tempData.contract)) {
          tempData.result = false
        }
      })

    const filteredAssets: TempData[] = Object.values(allUrns).filter((tempData) => tempData.result === undefined)
    console.log('filteredAssets', filteredAssets)

    const contracts: any = await Promise.all(
      filteredAssets.map((asset) => {
        if (thirdPartyContractRegistry.isErc721(asset.contract!)) {
          return erc721ContractFactory.at(asset.contract!)
        } else if (thirdPartyContractRegistry.isErc1155(asset.contract!)) {
          return erc1155ContractFactory.at(asset.contract!)
        }
        throw new Error('Unknown contract type')
      })
    )
    const batch: RPCSendableMessage[] = await Promise.all(
      contracts.map((contract: any, idx: number) => {
        if (thirdPartyContractRegistry.isErc721(filteredAssets[idx].contract!)) {
          return contract.ownerOf.toRPCMessage(filteredAssets[idx].nftId)
        } else if (thirdPartyContractRegistry.isErc1155(filteredAssets[idx].contract!)) {
          return contract.balanceOf.toRPCMessage(ethAddress, filteredAssets[idx].nftId)
        }
        throw new Error('Unknown contract type')
      })
    )

    const result = await sendBatch(provider, batch)
    // console.log('result', result)

    result.forEach((r: any, idx: number) => {
      if (!r.result) {
        filteredAssets[idx].result = false
      } else {
        const data = toData(r.result)
        if (thirdPartyContractRegistry.isErc721(filteredAssets[idx].contract!)) {
          filteredAssets[idx].result =
            (data === EMPTY_MESSAGE ? '' : contracts[idx].ownerOf.unpackOutput(data).toLowerCase()) ===
            ethAddress.toLowerCase()
        } else if (thirdPartyContractRegistry.isErc1155(filteredAssets[idx].contract!)) {
          filteredAssets[idx].result = (data === EMPTY_MESSAGE ? 0 : contracts[idx].balanceOf.unpackOutput(data)) > 0
        }
      }
    })

    // console.log('allUrn', allUrns)
    return itemUrns.map((itemUrn) => allUrns[itemUrn].result)
  }

  return {
    checkThirdPartyItems
  }
}
