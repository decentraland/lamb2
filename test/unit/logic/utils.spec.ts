import { Entity, EntityType, Rarity, WearableCategory } from '@dcl/schemas'
import { buildTrimmedEntity, ExplorerWearableEntity } from '../../../src/logic/utils'

describe('utils', function () {
    describe('buildTrimmedEntity', function () {
        const baseEntity: Entity = {
            version: 'v3',
            id: 'urn:decentraland:matic:collections-v2:0xabc:0',
            type: EntityType.WEARABLE,
            pointers: ['urn:decentraland:matic:collections-v2:0xabc:0'],
            timestamp: 1234567890,
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
                id: 'urn:decentraland:matic:collections-v2:0xabc:0',
                rarity: Rarity.EPIC,
                data: {
                    category: WearableCategory.UPPER_BODY,
                    tags: ['special', 'cool'],
                    representations: [
                        {
                            bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                            mainFile: 'model.glb',
                            contents: ['model.glb'],
                            overrideHides: [],
                            overrideReplaces: []
                        },
                        {
                            bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                            mainFile: 'model.glb',
                            contents: ['model.glb'],
                            overrideHides: [],
                            overrideReplaces: []
                        }
                    ]
                },
                thumbnail: 'thumbnail.png'
            }
        }

        it('should set isSmart to true when entity has "smart" tag (lowercase)', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['special', 'smart', 'cool']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(true)
        })

        it('should set isSmart to true when entity has "SMART" tag (uppercase)', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['special', 'SMART', 'cool']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(true)
        })

        it('should set isSmart to true when entity has "Smart" tag (mixed case)', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['special', 'Smart', 'cool']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(true)
        })

        it('should set isSmart to false when entity has no "smart" tag', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['special', 'cool', 'awesome']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(false)
        })

        it('should set isSmart to false when entity has empty tags array', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: []
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(false)
        })

        it('should set isSmart to false when entity has no tags property', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        category: WearableCategory.UPPER_BODY,
                        representations: baseEntity.metadata.data.representations
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(false)
        })

        it('should set isSmart to false when entity has undefined tags', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: undefined
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(false)
        })

        it('should correctly build complete ExplorerWearableEntity with isSmart flag', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['wearable', 'smart', 'tech']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            const expected: ExplorerWearableEntity = {
                id: 'urn:decentraland:matic:collections-v2:0xabc:0',
                thumbnail: 'QmThumbnailHash123',
                metadata: {
                    id: 'urn:decentraland:matic:collections-v2:0xabc:0',
                    rarity: Rarity.EPIC,
                    isSmart: true,
                    data: {
                        category: WearableCategory.UPPER_BODY,
                        representations: [
                            {
                                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale']
                            },
                            {
                                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale']
                            }
                        ]
                    }
                }
            }

            expect(result).toEqual(expected)
        })

        it('should handle entity without thumbnail', function () {
            const entity: Entity = {
                ...baseEntity,
                content: [
                    {
                        file: 'model.glb',
                        hash: 'QmModelHash456'
                    }
                ],
                metadata: {
                    ...baseEntity.metadata,
                    thumbnail: undefined,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['smart']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.thumbnail).toBeUndefined()
            expect(result.metadata.isSmart).toBe(true)
        })

        it('should handle entity with multiple representations', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['smart'],
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
                            },
                            {
                                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale', 'urn:decentraland:off-chain:base-avatars:BaseFemale'],
                                mainFile: 'unisex.glb',
                                contents: ['unisex.glb'],
                                overrideHides: [],
                                overrideReplaces: []
                            }
                        ]
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(true)
            expect(result.metadata.data.representations).toHaveLength(3)
            expect(result.metadata.data.representations[2].bodyShapes).toEqual([
                'urn:decentraland:off-chain:base-avatars:BaseMale',
                'urn:decentraland:off-chain:base-avatars:BaseFemale'
            ])
        })

        it('should not match partial "smart" string in tags', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['smartphone', 'smartwatch', 'outsmart']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(false)
        })

        it('should handle entity with only "smart" tag', function () {
            const entity: Entity = {
                ...baseEntity,
                metadata: {
                    ...baseEntity.metadata,
                    data: {
                        ...baseEntity.metadata.data,
                        tags: ['smart']
                    }
                }
            }

            const result = buildTrimmedEntity(entity)

            expect(result.metadata.isSmart).toBe(true)
        })
    })
})
