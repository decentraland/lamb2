import { Entity, Rarity, WearableCategory } from '@dcl/schemas'
import { buildTrimmedEntity } from '../../../src/logic/utils'
import { ItemType } from '../../../src/types'
import { createMockEntity } from '../../mocks/entity-mock'

describe('buildTrimmedEntity', function () {
  describe('when building a trimmed entity', function () {
    describe('and itemType is SMART_WEARABLE_V1', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, ItemType.SMART_WEARABLE_V1)
      })

      it('should set isSmart to true', function () {
        expect(result.metadata.isSmart).toBe(true)
      })
    })

    describe('and itemType is WEARABLE_V1', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V1)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is WEARABLE_V2', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is EMOTE_V1', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, ItemType.EMOTE_V1)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is undefined', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, undefined)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and itemType is not provided', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity)
      })

      it('should set isSmart to false', function () {
        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('and entity has a custom id', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity({ id: 'custom-entity-id' })
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
      })

      it('should map the entity id correctly', function () {
        expect(result.id).toBe('custom-entity-id')
      })
    })

    describe('and entity has standard metadata', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity()
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
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
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity({
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
        result = buildTrimmedEntity(entity, ItemType.SMART_WEARABLE_V1)
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
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity({
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
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
      })

      it('should return an empty representations array', function () {
        expect(result.metadata.data.representations).toHaveLength(0)
      })
    })

    describe('and entity has undefined thumbnail', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity({
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
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
      })

      it('should set thumbnail to undefined', function () {
        expect(result.thumbnail).toBeUndefined()
      })
    })

    describe('and entity has missing content', function () {
      let entity: Entity
      let result: any

      beforeEach(function () {
        entity = createMockEntity({
          content: []
        })
        result = buildTrimmedEntity(entity, ItemType.WEARABLE_V2)
      })

      it('should set thumbnail to undefined', function () {
        expect(result.thumbnail).toBeUndefined()
      })
    })
  })
})
