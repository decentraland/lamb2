import { EmoteCategory, Entity, Rarity, WearableCategory } from '@dcl/schemas'
import { buildTrimmedWearableEntity, buildTrimmedEmoteEntity, ExplorerWearableEntity, ExplorerEmoteEntity } from '../../../src/logic/utils'
import { ItemType, MixedWearable } from '../../../src/types'
import { createMockEntity } from '../../mocks/entity-mock'
import {
  createMockOnChainWearable,
  createMockThirdPartyWearable,
  createMockBaseWearable
} from '../../mocks/mixed-wearable-mock'
import { createMockOnChainEmote } from '../../mocks/mixed-emote-mock'

describe('buildTrimmedWearableEntity', function () {
  describe('when building a trimmed entity', function () {
    let mixedWearable: MixedWearable
    let result: ExplorerWearableEntity

    describe('and itemType is SMART_WEARABLE_V1', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ itemType: ItemType.SMART_WEARABLE_V1 })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set isSmart to true', function () {
        expect(result.metadata.isSmart).toBe(true)
      })
    })

    describe('and itemType is WEARABLE_V1', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ itemType: ItemType.WEARABLE_V1 })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is WEARABLE_V2', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ itemType: ItemType.WEARABLE_V2 })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is EMOTE_V1', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ itemType: ItemType.EMOTE_V1 })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is undefined', function () {
      beforeEach(function () {
        mixedWearable = createMockThirdPartyWearable()
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and entity has a custom id', function () {
      const entity = createMockEntity({ id: 'custom-entity-id' })

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ entity })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should map the entity id correctly', function () {
        expect(result.id).toBe('custom-entity-id')
      })
    })

    describe('and entity has standard metadata', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable()
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should map the thumbnail hash from content', function () {
        expect(result.thumbnail).toBe('QmThumbnailHash123')
      })

      it('should map the metadata id', function () {
        expect(result.metadata.id).toBe('metadata-id')
      })

      it('should map the rarity', function () {
        expect(result.metadata.rarity).toBe(Rarity.COMMON)
      })

      it('should map the category', function () {
        expect(result.metadata.data.category).toBe(WearableCategory.HAT)
      })

      it('should map the representations with bodyShapes', function () {
        expect(result.metadata.data.representations).toHaveLength(1)
        expect(result.metadata.data.representations[0].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseMale'
        ])
      })
    })

    describe('and entity has multiple representations', function () {
      const entity = createMockEntity({
        metadata: {
          id: 'metadata-id',
          name: 'Test Wearable',
          rarity: Rarity.EPIC,
          thumbnail: 'thumbnail.png',
          data: {
            category: WearableCategory.UPPER_BODY,
            representations: [
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                mainFile: 'male.glb',
                contents: ['male.glb'],
                overrideHides: [],
                overrideReplaces: []
              },
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                mainFile: 'female.glb',
                contents: ['female.glb'],
                overrideHides: [],
                overrideReplaces: []
              }
            ],
            tags: []
          }
        } as any
      })

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({
          entity,
          itemType: ItemType.SMART_WEARABLE_V1,
          rarity: 'epic',
          category: WearableCategory.UPPER_BODY
        })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should include all representations', function () {
        expect(result.metadata.data.representations).toHaveLength(2)
      })

      it('should map male bodyShapes correctly', function () {
        expect(result.metadata.data.representations[0].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseMale'
        ])
      })

      it('should map female bodyShapes correctly', function () {
        expect(result.metadata.data.representations[1].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseFemale'
        ])
      })

      it('should set isSmart to true for smart wearables', function () {
        expect(result.metadata.isSmart).toBe(true)
      })
    })

    describe('and entity has no representations', function () {
      const entity = createMockEntity({
        metadata: {
          id: 'metadata-id',
          name: 'Test Wearable',
          rarity: Rarity.COMMON,
          thumbnail: 'thumbnail.png',
          data: {
            category: WearableCategory.HAT,
            representations: [],
            tags: []
          }
        } as any
      })

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ entity })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should return an empty representations array', function () {
        expect(result.metadata.data.representations).toHaveLength(0)
      })
    })

    describe('and entity has undefined thumbnail', function () {
      const entity = createMockEntity({
        metadata: {
          id: 'metadata-id',
          name: 'Test Wearable',
          rarity: Rarity.COMMON,
          thumbnail: undefined,
          data: {
            category: WearableCategory.HAT,
            representations: [],
            tags: []
          }
        } as any
      })

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ entity })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set thumbnail to undefined', function () {
        expect(result.thumbnail).toBeUndefined()
      })
    })

    describe('and entity has missing content', function () {
      const entity = createMockEntity({
        content: []
      })

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({ entity })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should set thumbnail to undefined', function () {
        expect(result.thumbnail).toBeUndefined()
      })
    })

    describe('and wearable has on-chain individualData', function () {
      const onChainIndividualData: { id: string; tokenId: string; transferredAt: number; price: number }[] = [
        { id: 'nft-1', tokenId: '123', transferredAt: 1000, price: 100 },
        { id: 'nft-2', tokenId: '456', transferredAt: 2000, price: 200 }
      ]

      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({
          individualData: onChainIndividualData,
          amount: 2,
          maxTransferredAt: 2000
        })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should include individualData in the result', function () {
        expect(result.individualData).toBeDefined()
      })

      it('should map individualData correctly', function () {
        expect(result.individualData).toEqual(onChainIndividualData)
      })

      it('should preserve all NFT entries', function () {
        expect(result.individualData).toHaveLength(2)
      })

      it('should preserve NFT ids', function () {
        expect(result.individualData[0].id).toBe('nft-1')
        expect(result.individualData[1].id).toBe('nft-2')
      })

      it('should preserve tokenIds', function () {
        expect(result.individualData[0].tokenId).toBe('123')
        expect(result.individualData[1].tokenId).toBe('456')
      })
    })

    describe('and wearable has third-party individualData', function () {
      const thirdPartyIndividualData: { id: string; tokenId?: string }[] = [
        { id: 'tp-1', tokenId: '789' },
        { id: 'tp-2' }
      ]

      beforeEach(function () {
        mixedWearable = createMockThirdPartyWearable({
          individualData: thirdPartyIndividualData,
          amount: 2
        })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should include individualData in the result', function () {
        expect(result.individualData).toBeDefined()
      })

      it('should map individualData correctly', function () {
        expect(result.individualData).toEqual(thirdPartyIndividualData)
      })

      it('should preserve all items', function () {
        expect(result.individualData).toHaveLength(2)
      })

      it('should handle optional tokenId', function () {
        expect(result.individualData[0].tokenId).toBe('789')
        expect(result.individualData[1].tokenId).toBeUndefined()
      })
    })

    describe('and wearable has base wearable individualData', function () {
      const baseWearableIndividualData: { id: string; tokenId?: string }[] = [{ id: 'base-1' }]

      beforeEach(function () {
        mixedWearable = createMockBaseWearable({
          individualData: baseWearableIndividualData
        })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should include individualData in the result', function () {
        expect(result.individualData).toBeDefined()
      })

      it('should map individualData correctly', function () {
        expect(result.individualData).toEqual(baseWearableIndividualData)
      })
    })

    describe('and wearable has empty individualData array', function () {
      beforeEach(function () {
        mixedWearable = createMockOnChainWearable({
          individualData: [],
          amount: 0,
          minTransferredAt: 0,
          maxTransferredAt: 0
        })
        result = buildTrimmedWearableEntity(mixedWearable)
      })

      it('should include empty individualData array', function () {
        expect(result.individualData).toBeDefined()
        expect(result.individualData).toHaveLength(0)
      })
    })
  })
})

describe('buildTrimmedEmoteEntity', function () {
  describe('when building a trimmed emote entity', function () {
    let result: ExplorerEmoteEntity

    describe('and emote has standard metadata', function () {
      beforeEach(function () {
        result = buildTrimmedEmoteEntity(createMockOnChainEmote())
      })

      it('should map the entity id correctly', function () {
        expect(result.id).toBe('test-entity-id')
      })

      it('should map the thumbnail hash from content', function () {
        expect(result.thumbnail).toBe('QmThumbnailHash123')
      })

      it('should map the metadata id', function () {
        expect(result.metadata.id).toBe('emote-metadata-id')
      })

      it('should map the metadata name', function () {
        expect(result.metadata.name).toBe('Test Emote')
      })

      it('should map the rarity', function () {
        expect(result.metadata.rarity).toBe(Rarity.COMMON)
      })

      it('should map the category', function () {
        expect(result.metadata.data.category).toBe(EmoteCategory.DANCE)
      })

      it('should map the representations with bodyShapes only', function () {
        expect(result.metadata.data.representations).toHaveLength(1)
        expect(result.metadata.data.representations[0].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseMale'
        ])
      })

      it('should map individualData from the emote', function () {
        expect(result.individualData).toEqual([{ id: 'nft-1', tokenId: '123', transferredAt: 1000, price: 100 }])
      })
    })

    describe('and emote has a custom entity id', function () {
      beforeEach(function () {
        const entity = createMockEntity({ id: 'custom-emote-entity-id' })
        result = buildTrimmedEmoteEntity(createMockOnChainEmote({ entity }))
      })

      it('should map the entity id correctly', function () {
        expect(result.id).toBe('custom-emote-entity-id')
      })
    })

    describe('and emote has multiple individualData entries', function () {
      const individualData = [
        { id: 'nft-1', tokenId: '1', transferredAt: 1000, price: 100 },
        { id: 'nft-2', tokenId: '2', transferredAt: 2000, price: 200 }
      ]

      beforeEach(function () {
        result = buildTrimmedEmoteEntity(createMockOnChainEmote({ individualData, amount: 2 }))
      })

      it('should preserve all individualData entries', function () {
        expect(result.individualData).toHaveLength(2)
        expect(result.individualData[0].id).toBe('nft-1')
        expect(result.individualData[1].id).toBe('nft-2')
      })
    })

    describe('and emote has multiple representations', function () {
      beforeEach(function () {
        const entity = createMockEntity({
          metadata: {
            id: 'emote-metadata-id',
            name: 'Test Emote',
            rarity: Rarity.RARE,
            thumbnail: 'thumb.png',
            emoteDataADR74: {
              category: EmoteCategory.GREETINGS,
              representations: [
                { bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'], mainFile: 'm.glb', contents: [] },
                { bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'], mainFile: 'f.glb', contents: [] }
              ],
              tags: [],
              loop: false
            }
          } as any
        })
        result = buildTrimmedEmoteEntity(createMockOnChainEmote({ entity }))
      })

      it('should include all representations', function () {
        expect(result.metadata.data.representations).toHaveLength(2)
      })

      it('should strip extra representation fields, keeping only bodyShapes', function () {
        expect(Object.keys(result.metadata.data.representations[0])).toEqual(['bodyShapes'])
      })
    })

    describe('and emote has undefined thumbnail', function () {
      beforeEach(function () {
        const entity = createMockEntity({
          metadata: {
            id: 'emote-metadata-id',
            name: 'Test Emote',
            thumbnail: undefined,
            emoteDataADR74: { category: EmoteCategory.DANCE, representations: [], tags: [], loop: false }
          } as any
        })
        result = buildTrimmedEmoteEntity(createMockOnChainEmote({ entity }))
      })

      it('should set thumbnail to undefined', function () {
        expect(result.thumbnail).toBeUndefined()
      })
    })

    describe('and emote has no representations', function () {
      beforeEach(function () {
        const entity = createMockEntity({
          metadata: {
            id: 'emote-metadata-id',
            name: 'Test Emote',
            thumbnail: 'thumb.png',
            emoteDataADR74: { category: EmoteCategory.DANCE, representations: [], tags: [], loop: false }
          } as any
        })
        result = buildTrimmedEmoteEntity(createMockOnChainEmote({ entity }))
      })

      it('should return an empty representations array', function () {
        expect(result.metadata.data.representations).toHaveLength(0)
      })
    })
  })
})
