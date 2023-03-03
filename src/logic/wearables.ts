import { AppComponents, CachedThirdPartyWearable, CachedWearable, Pagination, WearableForResponse } from '../types'
import { EntityType } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../adapters/definitions'
import { compareByRarity } from './utils'

export async function getWearablesForAddress(
  {
    logs,
    wearablesComponent,
    thirdPartyComponent,
    definitions
  }: Pick<AppComponents, 'wearablesComponent' | 'thirdPartyComponent' | 'definitions' | 'logs'>,
  address: string,
  includeTPW: boolean,
  includeDefinitions: boolean,
  pagination: Pagination
) {
  const logger = logs.getLogger('wearables')

  const dclWearables = await wearablesComponent.fetchByOwner(address)
  logger.debug(`${dclWearables.length} dcl wearables retrieved from cache`)

  let allWearables: (CachedThirdPartyWearable | CachedWearable)[]
  if (pagination.orderBy === 'rarity') {
    allWearables = Array.from(dclWearables).sort(compareByRarity)
  } else {
    allWearables = dclWearables
  }

  if (includeTPW) {
    const tpWearables = await thirdPartyComponent.fetchByOwner(address)
    logger.debug(`${tpWearables.length} tp wearables retrieved from cache`)
    for (const tpWearable of tpWearables) {
      allWearables.push(tpWearable)
    }
  }

  const wearablesTotal = allWearables.length

  if (pagination.pageSize && pagination.pageNum) {
    allWearables = allWearables.slice(
      (pagination.pageNum - 1) * pagination.pageSize,
      pagination.pageNum * pagination.pageSize
    )
  }

  if (includeDefinitions) {
    await definitions.decorateNFTsWithDefinitions(
      allWearables,
      EntityType.WEARABLE,
      extractWearableDefinitionFromEntity
    )
  }

  return {
    wearables: allWearables.map((wearable: CachedThirdPartyWearable | CachedWearable): WearableForResponse => {
      return {
        urn: wearable.urn,
        individualData: wearable.individualData,
        amount: wearable.amount
      }
    }),
    totalAmount: wearablesTotal
  }
}
