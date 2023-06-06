import { IBaseComponent } from '@well-known-components/interfaces'
import RequestManager, { ContractFactory } from 'eth-connect'
import LRUCache from 'lru-cache'
import { AppComponents } from '../types'
import {
  getNameDenylistFromContract,
  l1Contracts,
  L1Network,
  listAbi,
  NameDenylistContract
} from '@dcl/catalyst-contracts'

export type NameDenylistFetcher = IBaseComponent & {
  getNameDenylist(): Promise<string[]>
}

const HOUR_MS = 1000 * 60 * 60

export async function createNameDenylistFetcher(
  { l1Provider }: Pick<AppComponents, 'l1Provider'>,
  network: L1Network
): Promise<NameDenylistFetcher> {
  const requestManager = new RequestManager(l1Provider)
  const factory = new ContractFactory(requestManager, listAbi)
  const contract: NameDenylistContract = (await factory.at(l1Contracts[network].nameDenylist)) as any

  const cache = new LRUCache<number, string[]>({
    max: 1,
    ttl: HOUR_MS * 6,
    fetchMethod: async function (_: number): Promise<string[]> {
      return getNameDenylistFromContract(contract)
    }
  })

  async function getNameDenylist(): Promise<string[]> {
    return (await cache.fetch(0)) || []
  }

  return {
    getNameDenylist
  }
}
