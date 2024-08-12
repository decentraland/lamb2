import { AppComponents } from '../types'
import { FetcherError } from './elements-fetcher'
import { ContractNetwork } from '@dcl/schemas'

export type AlchemyNftFetcher = {
  getNFTsForOwner(owner: string, contractsByNetwork: Record<string, Set<string>>): Promise<string[]>
}

export async function createAlchemyNftFetcher({
  config,
  logs,
  fetch
}: Pick<AppComponents, 'config' | 'logs' | 'fetch'>): Promise<AlchemyNftFetcher> {
  const logger = logs.getLogger('alchemy-nft-fetcher')
  const nftWorkerBaseUrl = (await config.getString('NFT_WORKER_BASE_URL')) || 'https://nfts.decentraland.org'

  async function getNFTsForOwnerForNetwork(
    owner: string,
    network: string,
    contractAddresses: Set<string>
  ): Promise<string[]> {
    if (!Object.values(ContractNetwork).includes(network as ContractNetwork)) {
      logger.warn(`Network ${network} not supported for LinkedWearables`)
      return []
    }

    const response = await fetch.fetch(`${nftWorkerBaseUrl}/wallets/${owner}/networks/${network}/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(Array.from(contractAddresses))
    })

    if (!response.ok) {
      throw new FetcherError(`Error fetching NFTs from Alchemy: ${response.status} - ${response.statusText}`)
    }

    const nfts = await response.json()

    return nfts.data as string[]
  }

  async function getNFTsForOwner(owner: string, contractsByNetwork: Record<string, Set<string>>): Promise<string[]> {
    const all = await Promise.all(
      Object.entries(contractsByNetwork).map(([network, contractAddresses]) => {
        return getNFTsForOwnerForNetwork(owner, network, contractAddresses)
      })
    )

    return all.flat(1)
  }

  return {
    getNFTsForOwner
  }
}
