import { Entity, Rarity, WearableCategory } from '@dcl/schemas'
import { buildTrimmedEntity } from '../../../src/logic/utils'

describe('utils', function () {
  describe('buildTrimmedEntity', function () {
    const createMockEntity = (overrides?: Partial<Entity>): Entity => {
      return {
        id: 'test-entity-id',
        type: 'wearable',
        pointers: ['urn:decentraland:matic:collections-v2:0xtest:0'],
        timestamp: Date.now(),
        content: [
          {
            file: 'thumbnail.png',
            hash: 'QmThumbnailHash123'
          },
          {
            file: 'model.glb',
            hash: 'QmModelHash456'
          }
        ],
        metadata: {
          id: 'metadata-id',
          name: 'Test Wearable',
          description: 'A test wearable',
          rarity: Rarity.COMMON,
          thumbnail: 'thumbnail.png',
          data: {
            category: WearableCategory.HAT,
            representations: [
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                mainFile: 'model.glb',
                contents: ['model.glb'],
                overrideHides: [],
                overrideReplaces: []
              }
            ],
            tags: []
          }
        },
        ...overrides
      } as Entity
    }

    describe('isSmart flag', function () {
      let entity: Entity

      beforeEach(function () {
        entity = createMockEntity()
      })

      it('should return isSmart as true when itemType starts with "smart_wearable"', function () {
        const result = buildTrimmedEntity(entity, 'smart_wearable')

        expect(result.metadata.isSmart).toBe(true)
      })

      it('should return isSmart as true when itemType is "smart_wearable_v1"', function () {
        const result = buildTrimmedEntity(entity, 'smart_wearable_v1')

        expect(result.metadata.isSmart).toBe(true)
      })

      it('should return isSmart as true when itemType is "smart_wearable_v2"', function () {
        const result = buildTrimmedEntity(entity, 'smart_wearable_v2')

        expect(result.metadata.isSmart).toBe(true)
      })

      it('should return isSmart as true when itemType starts with "smart_wearable_" followed by any text', function () {
        const result = buildTrimmedEntity(entity, 'smart_wearable_custom_version')

        expect(result.metadata.isSmart).toBe(true)
      })

      it('should return isSmart as false when itemType is "wearable"', function () {
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType is "emote"', function () {
        const result = buildTrimmedEntity(entity, 'emote')

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType is undefined', function () {
        const result = buildTrimmedEntity(entity, undefined)

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType is not provided', function () {
        const result = buildTrimmedEntity(entity)

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType is an empty string', function () {
        const result = buildTrimmedEntity(entity, '')

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType contains "smart_wearable" but does not start with it', function () {
        const result = buildTrimmedEntity(entity, 'not_smart_wearable')

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should return isSmart as false when itemType is "SMART_WEARABLE" (uppercase)', function () {
        const result = buildTrimmedEntity(entity, 'SMART_WEARABLE')

        expect(result.metadata.isSmart).toBe(false)
      })

      it('should be case-sensitive and return false for "Smart_Wearable"', function () {
        const result = buildTrimmedEntity(entity, 'Smart_Wearable')

        expect(result.metadata.isSmart).toBe(false)
      })
    })

    describe('entity structure', function () {
      it('should correctly map entity id', function () {
        const entity = createMockEntity({ id: 'custom-entity-id' })
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.id).toBe('custom-entity-id')
      })

      it('should correctly map thumbnail hash', function () {
        const entity = createMockEntity()
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.thumbnail).toBe('QmThumbnailHash123')
      })

      it('should correctly map metadata id', function () {
        const entity = createMockEntity()
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.id).toBe('metadata-id')
      })

      it('should correctly map rarity', function () {
        const entity = createMockEntity()
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.rarity).toBe(Rarity.COMMON)
      })

      it('should correctly map category', function () {
        const entity = createMockEntity()
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.data.category).toBe(WearableCategory.HAT)
      })

      it('should correctly map representations with bodyShapes', function () {
        const entity = createMockEntity()
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.data.representations).toHaveLength(1)
        expect(result.metadata.data.representations[0].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseMale'
        ])
      })

      it('should handle entities with multiple representations', function () {
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
        const result = buildTrimmedEntity(entity, 'smart_wearable')

        expect(result.metadata.data.representations).toHaveLength(2)
        expect(result.metadata.data.representations[0].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseMale'
        ])
        expect(result.metadata.data.representations[1].bodyShapes).toEqual([
          'urn:decentraland:off-chain:base-avatars:BaseFemale'
        ])
        expect(result.metadata.isSmart).toBe(true)
      })

      it('should handle entities with no representations', function () {
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
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.metadata.data.representations).toHaveLength(0)
      })

      it('should handle entities with undefined thumbnail', function () {
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
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.thumbnail).toBeUndefined()
      })

      it('should handle entities with missing content', function () {
        const entity = createMockEntity({
          content: []
        })
        const result = buildTrimmedEntity(entity, 'wearable')

        expect(result.thumbnail).toBeUndefined()
      })
    })
  })
})
