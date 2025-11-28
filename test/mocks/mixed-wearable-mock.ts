import { WearableCategory } from '@dcl/schemas'
import { ItemType, MixedBaseWearable, MixedOnChainWearable, MixedThirdPartyWearable } from '../../src/types'
import { createMockEntity } from './entity-mock'

export const createMockOnChainWearable = (overrides?: Partial<MixedOnChainWearable>): MixedOnChainWearable => {
  const entity = overrides?.entity || createMockEntity()

  return {
    type: 'on-chain',
    entity,
    itemType: ItemType.WEARABLE_V2,
    individualData: [{ id: 'nft-1', tokenId: '123', transferredAt: 1000, price: 100 }],
    urn: 'urn:decentraland:ethereum:collections-v2:0xabc:0',
    amount: 1,
    name: 'Test Wearable',
    rarity: 'common',
    category: WearableCategory.HAT,
    minTransferredAt: 1000,
    maxTransferredAt: 1000,
    ...overrides
  }
}

export const createMockThirdPartyWearable = (overrides?: Partial<MixedThirdPartyWearable>): MixedThirdPartyWearable => {
  const entity = overrides?.entity || createMockEntity()

  return {
    type: 'third-party',
    entity,
    individualData: [{ id: 'tp-1', tokenId: '456' }],
    urn: 'urn:decentraland:matic:collections-thirdparty:thirdparty:collection:item',
    amount: 1,
    name: 'Test Third Party Wearable',
    category: WearableCategory.HAT,
    ...overrides
  }
}

export const createMockBaseWearable = (overrides?: Partial<MixedBaseWearable>): MixedBaseWearable => {
  const entity = overrides?.entity || createMockEntity()

  return {
    type: 'base-wearable',
    entity,
    individualData: [{ id: 'base-1' }],
    urn: 'urn:decentraland:off-chain:base-avatars:hat',
    amount: 1,
    name: 'Base Hat',
    category: WearableCategory.HAT,
    ...overrides
  }
}
