import { EmoteCategory, Rarity } from '@dcl/schemas'
import { MixedOnChainEmote } from '../../src/controllers/handlers/explorer-emotes-handler'
import { ItemType } from '../../src/types'
import { createMockEntity } from './entity-mock'

export const createMockOnChainEmote = (overrides?: Partial<MixedOnChainEmote>): MixedOnChainEmote => {
  const entity = overrides?.entity || createMockEntity({
    metadata: {
      id: 'emote-metadata-id',
      name: 'Test Emote',
      description: 'A test emote',
      rarity: Rarity.COMMON,
      thumbnail: 'thumbnail.png',
      emoteDataADR74: {
        category: EmoteCategory.DANCE,
        representations: [
          {
            bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
            mainFile: 'emote.glb',
            contents: ['emote.glb']
          }
        ],
        tags: [],
        loop: false
      }
    } as any
  })

  return {
    type: 'on-chain',
    entity,
    itemType: ItemType.EMOTE_V1,
    individualData: [{ id: 'nft-1', tokenId: '123', transferredAt: 1000, price: 100 }],
    urn: 'urn:decentraland:matic:collections-v2:0xtest:0',
    amount: 1,
    name: 'Test Emote',
    rarity: Rarity.COMMON,
    category: EmoteCategory.DANCE,
    minTransferredAt: 1000,
    maxTransferredAt: 1000,
    ...overrides
  }
}
