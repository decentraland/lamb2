import { IBaseComponent } from '@well-known-components/interfaces'
import RequestManager, { ContractFactory } from 'eth-connect'
import LRUCache from 'lru-cache'
import { AppComponents } from '../types'
import { getPoisFromContract, l2Contracts, L2Network, listAbi, PoiContract } from '@dcl/catalyst-contracts'

export type POIsFetcher = IBaseComponent & {
  getPOIs(): Promise<string[]>
}

const HOUR_MS = 1000 * 60 * 60

export async function createPOIsFetcher(
  { l2Provider }: Pick<AppComponents, 'l2Provider'>,
  network: L2Network
): Promise<POIsFetcher> {
  const requestManager = new RequestManager(l2Provider)
  const factory = new ContractFactory(requestManager, listAbi)
  const contract: PoiContract = (await factory.at(l2Contracts[network].poi)) as any

  const cache = new LRUCache<number, string[]>({
    max: 1,
    ttl: HOUR_MS * 6,
    fetchMethod: async function (_: number): Promise<string[]> {
      return getPoisFromContract(contract)
    }
  })

  async function getPOIs(): Promise<string[]> {
    return (await cache.fetch(0)) || []
  }

  return {
    getPOIs
  }
}
