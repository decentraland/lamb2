import { defaultServerConfig } from '@well-known-components/test-helpers'
import { Entity, EntityType, Outfits, WearableCategory } from '@dcl/schemas'
import { testWithComponents } from '../components'
import { createConfigComponent } from '@well-known-components/env-config-provider'

testWithComponents(() => {
  return {}
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return outfits when all wearables are owned', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 1,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:3',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:1',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:5'
            ]
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:3',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:1',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:5'
            ]
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '5',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand',
            id: 'id-2',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-2',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          }
        ]
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
              id: 'id-3',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              id: 'id-4',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj).toEqual(outfitsEntity)
  })
})

testWithComponents(() => {
  const config = createConfigComponent({
    ...defaultServerConfig(),
    CONTENT_URL: 'https://peer.decentraland.org/content',
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: 'version',
    HTTP_SERVER_PORT: '7272',
    ENSURE_ERC_721: 'false'
  })

  return {
    config
  }
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return and extends outfits when all wearables are owned and ERC-721 is disabled', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 1,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
            ]
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
            ]
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '5',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand',
            id: 'id-2',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-2',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          }
        ]
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
              id: 'id-3',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              id: 'id-4',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.metadata).toEqual({
      outfits: [
        {
          slot: 1,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
            ]
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
            ]
          }
        }
      ],
      namesForExtraSlots: []
    })
  })
})

testWithComponents(() => {
  const config = createConfigComponent({
    ...defaultServerConfig(),
    CONTENT_URL: 'https://peer.decentraland.org/content',
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: 'version',
    HTTP_SERVER_PORT: '7272',
    ENSURE_ERC_721: 'true'
  })

  return {
    config
  }
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return extended outfits when all extended wearables are owned', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 1,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:3',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:1',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:1'
            ]
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:3',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:1',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:5'
            ]
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '5',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand',
            id: 'id-2',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-2',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          }
        ]
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
              id: 'id-3',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              id: 'id-4',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj).toEqual(outfitsEntity)
  })
})

testWithComponents(() => {
  return {}
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('remove outfit when wearables are not owned', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 1,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:3',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:1',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:5'
            ]
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
            hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
            skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
            wearables: [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:7',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
            ]
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '5',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
            id: 'id-1',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          },
          {
            urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand',
            id: 'id-2',
            tokenId: '1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-2',
                category: WearableCategory.EYEWEAR
              }
            },
            item: {
              rarity: 'unique',
              price: 100
            }
          }
        ]
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
              id: 'id-3',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            },
            {
              urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
              id: 'id-4',
              tokenId: '1',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.metadata.outfits.length).toEqual(1)
    expect(responseObj.metadata.outfits[0].slot).toEqual(1)
    expect(responseObj.metadata.outfits[0]).toEqual(outfitsMetadata.outfits[0])
  })
})

testWithComponents(() => {
  const config = createConfigComponent({
    ...defaultServerConfig(),
    CONTENT_URL: 'https://peer.decentraland.org/content',
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: 'version',
    HTTP_SERVER_PORT: '7272',
    ENSURE_ERC_721: 'false'
  })

  return {
    config
  }
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return complete outfits when its contain base wearables and an owned wearable', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 0,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            eyes: {
              color: {
                r: 0.37254902720451355,
                g: 0.2235294133424759,
                b: 0.19607843458652496
              }
            },
            hair: {
              color: {
                r: 0.23529411852359772,
                g: 0.12941177189350128,
                b: 0.04313725605607033
              }
            },
            skin: {
              color: {
                r: 0.4901960790157318,
                g: 0.364705890417099,
                b: 0.27843138575553894
              }
            },
            wearables: [
              'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
              'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0',
              'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
              'urn:decentraland:off-chain:base-avatars:pony_tail',
              'urn:decentraland:off-chain:base-avatars:pearls_earring',
              'urn:decentraland:off-chain:base-avatars:f_mouth_05',
              'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
              'urn:decentraland:off-chain:base-avatars:f_eyes_06'
            ],
            forceRender: []
          }
        },
        {
          slot: 1,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 3,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 4,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.metadata.outfits[0].outfit.wearables).toEqual(outfitsMetadata.outfits[0].outfit.wearables)
  })
})

testWithComponents(() => {
  const config = createConfigComponent({
    ...defaultServerConfig(),
    CONTENT_URL: 'https://peer.decentraland.org/content',
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: 'version',
    HTTP_SERVER_PORT: '7272',
    ENSURE_ERC_721: 'false'
  })

  return {
    config
  }
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return complete outfit without extensions when outfit comes extended from content-server but ERC-721 standard is disabled', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 0,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            eyes: {
              color: {
                r: 0.37254902720451355,
                g: 0.2235294133424759,
                b: 0.19607843458652496
              }
            },
            hair: {
              color: {
                r: 0.23529411852359772,
                g: 0.12941177189350128,
                b: 0.04313725605607033
              }
            },
            skin: {
              color: {
                r: 0.4901960790157318,
                g: 0.364705890417099,
                b: 0.27843138575553894
              }
            },
            wearables: [
              'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
              'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0:3',
              'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
              'urn:decentraland:off-chain:base-avatars:pony_tail',
              'urn:decentraland:off-chain:base-avatars:pearls_earring',
              'urn:decentraland:off-chain:base-avatars:f_mouth_05',
              'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
              'urn:decentraland:off-chain:base-avatars:f_eyes_06'
            ],
            forceRender: []
          }
        },
        {
          slot: 1,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 3,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 4,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.metadata.outfits[0].outfit.wearables).toEqual([
      'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
      'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0',
      'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
      'urn:decentraland:off-chain:base-avatars:pony_tail',
      'urn:decentraland:off-chain:base-avatars:pearls_earring',
      'urn:decentraland:off-chain:base-avatars:f_mouth_05',
      'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
      'urn:decentraland:off-chain:base-avatars:f_eyes_06'
    ])
  })
})

testWithComponents(() => {
  const config = createConfigComponent({
    ...defaultServerConfig(),
    CONTENT_URL: 'https://peer.decentraland.org/content',
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: 'version',
    HTTP_SERVER_PORT: '7272'
  })

  return {
    config
  }
})('integration tests for /outfits/:id', function ({ components, stubComponents }) {
  it('return complete extended outfit when outfit comes extended from content-server', async () => {
    const { localFetch } = components
    const { content, theGraph } = stubComponents
    const address = '0x1'

    const outfitsMetadata: Outfits = {
      outfits: [
        {
          slot: 0,
          outfit: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            eyes: {
              color: {
                r: 0.37254902720451355,
                g: 0.2235294133424759,
                b: 0.19607843458652496
              }
            },
            hair: {
              color: {
                r: 0.23529411852359772,
                g: 0.12941177189350128,
                b: 0.04313725605607033
              }
            },
            skin: {
              color: {
                r: 0.4901960790157318,
                g: 0.364705890417099,
                b: 0.27843138575553894
              }
            },
            wearables: [
              'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
              'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0:3',
              'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
              'urn:decentraland:off-chain:base-avatars:pony_tail',
              'urn:decentraland:off-chain:base-avatars:pearls_earring',
              'urn:decentraland:off-chain:base-avatars:f_mouth_05',
              'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
              'urn:decentraland:off-chain:base-avatars:f_eyes_06'
            ],
            forceRender: []
          }
        },
        {
          slot: 1,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 2,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 3,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        },
        {
          slot: 4,
          outfit: {
            bodyShape: '',
            eyes: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            hair: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            skin: {
              color: {
                r: 0,
                g: 0,
                b: 0
              }
            },
            wearables: [],
            forceRender: []
          }
        }
      ],
      namesForExtraSlots: []
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }

    content.fetchEntitiesByPointers.resolves([outfitsEntity])
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0',
              id: 'id-3',
              tokenId: '3',
              category: 'wearable',
              transferredAt: Date.now(),
              metadata: {
                wearable: {
                  name: 'name-3',
                  category: WearableCategory.EYEWEAR
                }
              },
              item: {
                rarity: 'unique',
                price: 100
              }
            }
          ]
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValueOnce({ nfts: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.metadata.outfits[0].outfit.wearables).toEqual([
      'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
      'urn:decentraland:mumbai:collections-v2:0x6abaadad08b761e0a90f467d8dd3095583b4f3a2:0:3',
      'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
      'urn:decentraland:off-chain:base-avatars:pony_tail',
      'urn:decentraland:off-chain:base-avatars:pearls_earring',
      'urn:decentraland:off-chain:base-avatars:f_mouth_05',
      'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
      'urn:decentraland:off-chain:base-avatars:f_eyes_06'
    ])
  })
})
