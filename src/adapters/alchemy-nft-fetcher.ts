import { AppComponents } from '../types'
import { FetcherError } from './elements-fetcher'
import { chunks } from '../logic/chunking'

export type AlchemyNftFetcher = {
  getNFTsForOwner(owner: string, contractsByNetwork: Record<string, Set<string>>): Promise<string[]>
}

// Max number of contracts that can be queried at once in Alchemy API
const MAX_CONTRACTS = 45

type AlchemyNft = {
  contractAddress: string
  tokenId: string
}

type AlchemyNftResponse = {
  ownedNfts: AlchemyNft[]
  totalNfts: number
  pageKey: string | null
}

const networkMappings: Record<string, string> = {
  mainnet: 'eth-mainnet',
  sepolia: 'eth-sepolia',
  matic: 'polygon-mainnet',
  amoy: 'polygon-amoy'
}

export async function createAlchemyNftFetcher({
  config,
  logs,
  fetch
}: Pick<AppComponents, 'config' | 'logs' | 'fetch'>): Promise<AlchemyNftFetcher> {
  const logger = logs.getLogger('alchemy-nft-fetcher')
  const apiKey = await config.requireString('ALCHEMY_API_KEY')

  async function fetchAllPages(mapping: string, owner: string, contractAddresses: string[], network: string) {
    const allNfts: string[] = []

    let nextPageToken: string | null = null
    do {
      // https://nfts-provider.decentraland.org/wallets/:address/networks/:network/nfts

      // const response2 = await fetch.fetch(
      //   `https://nfts-provider.decentraland.org/wallets/${owner}/networks/${network}`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       accept: 'application/json'
      //     },
      //     body: JSON.stringify(contractAddresses)
      //   }
      // )
      //
      // if (!response2.ok) {
      //   throw new FetcherError(`Error fetching NFTs from Alchemy: ${response2.status} - ${response2.statusText}`)
      // }
      //
      // const json2 = (await response2.json()) as AlchemyNftResponse

      const u = new URL(`https://${mapping}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`)
      u.searchParams.append('owner', owner)
      u.searchParams.append('pageSize', '100')
      u.searchParams.append('withMetadata', 'false')
      for (const contract of contractAddresses) {
        u.searchParams.append('contractAddresses[]', contract)
      }
      if (nextPageToken) {
        u.searchParams.append('pageKey', nextPageToken)
      }
      const response = await fetch.fetch(u, {
        headers: {
          accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new FetcherError(`Error fetching NFTs from Alchemy: ${response.status} - ${response.statusText}`)
      }

      const json = (await response.json()) as AlchemyNftResponse
      nextPageToken = json.pageKey
      allNfts.push(
        ...json.ownedNfts.map((nft: AlchemyNft) => `${network}:${nft.contractAddress.toLowerCase()}:${nft.tokenId}`)
      )
    } while (nextPageToken)

    return allNfts
  }

  async function getNFTsForOwnerForNetwork(
    owner: string,
    network: string,
    contractAddresses: Set<string>
  ): Promise<string[]> {
    const mapping = networkMappings[network]
    if (!mapping) {
      logger.warn(`Network ${network} not supported for LinkedWearables`)
      return []
    }

    const allNfts: string[] = []
    for (const contracts of chunks(Array.from(contractAddresses), MAX_CONTRACTS)) {
      allNfts.push(...(await fetchAllPages(mapping, owner, contracts, network)))
    }

    return allNfts
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
