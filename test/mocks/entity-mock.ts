import { Entity, Rarity, WearableCategory } from '@dcl/schemas'

export const createMockEntity = (overrides?: Partial<Entity>): Entity => {
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
