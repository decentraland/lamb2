import { IBaseComponent } from '@well-known-components/interfaces'
import RequestManager, { bytesToHex, ContractFactory } from 'eth-connect'
import LRUCache from 'lru-cache'
import { AppComponents } from '../types'
import {
  catalystAbi,
  CatalystByIdResult,
  getCatalystServersFromDAO,
  l1Contracts,
  L1Network
} from '@dcl/catalyst-contracts'

export type Server = {
  baseUrl: string
  owner: string
  id: string
}

export type CatalystsFetcher = IBaseComponent & {
  getCatalystServers(): Promise<Server[]>
}

const HOUR_MS = 1000 * 60 * 60

export async function createCatalystsFetcher(
  { l1Provider }: Pick<AppComponents, 'l1Provider'>,
  network: L1Network
): Promise<CatalystsFetcher> {
  const requestManager = new RequestManager(l1Provider)
  const factory = new ContractFactory(requestManager, catalystAbi)
  const contract = (await factory.at(l1Contracts[network].catalyst)) as any
  const catalystContract = {
    async catalystCount(): Promise<number> {
      return contract.catalystCount()
    },
    async catalystIds(i: number): Promise<string> {
      return contract.catalystIds(i)
    },
    async catalystById(catalystId: string): Promise<CatalystByIdResult> {
      const [id, owner, domain] = await contract.catalystById(catalystId)
      return { id: '0x' + bytesToHex(id), owner, domain }
    }
  }

  const catalysts = new LRUCache<number, Server[]>({
    max: 1,
    ttl: HOUR_MS * 6,
    fetchMethod: async function (_: number): Promise<Server[]> {
      const catalysts = await getCatalystServersFromDAO(catalystContract)
      return catalysts.map(({ owner, id, address }) => {
        return { baseUrl: address, owner, id }
      })
    }
  })

  async function getCatalystServers(): Promise<Server[]> {
    const servers = await catalysts.fetch(0)
    return servers || []
  }

  return {
    getCatalystServers
  }
}
