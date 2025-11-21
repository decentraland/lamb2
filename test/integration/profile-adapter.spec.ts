import { defaultServerConfig } from '@well-known-components/test-helpers'
import { testWithComponents } from '../components'
import { Response } from 'node-fetch'
import sinon from 'sinon'
import {
  profileEntityFull,
  profileEntityFullWithExtendedItems,
  profileEntityTwoEthWearables,
  tpwResolverResponseFull,
  profileEntityWithBaseEmotes,
  profileEntityWithOwnedEmotes,
  profileEntityWithMixedEmotes
} from './data/profiles-responses'
import { WearableCategory } from '@dcl/schemas'
import { createProfilesComponent } from '../../src/adapters/profiles'
import { createConfigComponent } from '@well-known-components/env-config-provider'
import { generateWearableEntity } from '../data/wearables'

testWithComponents(() => {
  const wearables = [
    {
      urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
      id: 'id-3',
      tokenId: 'tokenId-3',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-3',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
      id: 'id-4',
      tokenId: 'tokenId-3',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-4',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      id: 'id-1',
      tokenId: 'tokenId-1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-1',
          category: 'eyewear'
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
      tokenId: 'tokenId-2',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-2',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    }
  ]

  const names = [
    {
      name: 'cryptonico',
      contractAddress: '0x2a187453064356c898df701890301b1a14de3f78e',
      tokenId: 'id1'
    }
  ]

  const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, names })

  return { marketplaceApiFetcher }
})('integration tests for profile adapter', function ({ components, stubComponents }) {
  it('calling with a single profile address, owning everything claimed', async () => {
    const {
      metrics,
      config,
      contentServerUrl,
      ownershipCaches,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker
    } = components
    const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
    const address = '0x1'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityFull]))

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [{ id: 'id1', name: 'cryptonico' }] })

    jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([
      {
        id: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta',
        resolver: 'https://api.swappable.io/api/v1',
        metadata: {
          thirdParty: {
            name: 'test',
            description: 'test'
          }
        }
      }
    ])
    fetch.fetch
      .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
    entitiesFetcher.fetchEntities
      .withArgs(tpwResolverResponseFull.assets.map((a) => a.urn.decentraland))
      .resolves(tpwResolverResponseFull.assets.map((a) => generateWearableEntity(a.urn.decentraland)))

    const profilesComponent = await createProfilesComponent({
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      content,
      contentServerUrl,
      theGraph,
      config,
      fetch,
      ownershipCaches,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher
    })
    const profiles = await profilesComponent.getProfiles([address])
    expect(profiles).toHaveLength(1)
    const profile = profiles[0]

    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [address])

    expect(profile.avatars.length).toEqual(1)
    expect(profile.avatars?.[0].hasClaimedName).toEqual(true)
    expect(profile.avatars?.[0].ethAddress).toEqual('0x1')
    expect(profile.avatars?.[0].name).toEqual('cryptonico')
    expect(profile.avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(profile.avatars?.[0].avatar.snapshots.body).toEqual(
      `https://peer.decentraland.org/content/entities/${profileEntityFull.id}/body.png`
    )
    expect(profile.avatars?.[0].avatar.snapshots.face256).toEqual(
      `https://peer.decentraland.org/content/entities/${profileEntityFull.id}/face.png`
    )
    expect(profile.avatars?.[0].avatar.wearables).toEqual([
      'urn:decentraland:off-chain:base-avatars:eyebrows_00',
      'urn:decentraland:off-chain:base-avatars:short_hair',
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7:tokenId-3',
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1:tokenId-3',
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:tokenId-1',
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand:tokenId-2',
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f',
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
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
    HTTP_SERVER_PORT: '7272',
    ENSURE_ERC_721: 'true'
  })

  const wearables = [
    {
      urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
      id: 'id-3',
      tokenId: '3',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-3',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
      id: 'id-4',
      tokenId: '3',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-4',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      id: 'id-1',
      tokenId: '1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-1',
          category: 'eyewear'
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
      tokenId: '2',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-2',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    }
  ]

  const names = [
    {
      name: 'cryptonico',
      contractAddress: '0x2a187453064356c898df701890301b1a14de3f78e',
      tokenId: 'id1'
    }
  ]

  const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, names })

  return {
    config,
    marketplaceApiFetcher
  }
})(
  'integration tests for profile adapter: calling with a single profile address, ensuring ERC-721 and owning everything claimed',
  function ({ components, stubComponents }) {
    it('should work', async () => {
      const {
        metrics,
        config,
        contentServerUrl,
        ownershipCaches,
        thirdPartyProvidersStorage,
        logs,
        wearablesFetcher,
        emotesFetcher,
        namesFetcher,
        l1ThirdPartyItemChecker,
        l2ThirdPartyItemChecker
      } = components
      const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
      const address = '0x1'

      content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityFull]))

      theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [{ id: 'id1', name: 'cryptonico' }] })

      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([
        {
          id: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta',
          resolver: 'https://api.swappable.io/api/v1',
          metadata: {
            thirdParty: {
              name: 'test',
              description: 'test'
            }
          }
        }
      ])
      fetch.fetch
        .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1/assets')
        .onCall(0)
        .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
        .onCall(1)
        .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      entitiesFetcher.fetchEntities
        .withArgs(tpwResolverResponseFull.assets.map((a) => a.urn.decentraland))
        .resolves(tpwResolverResponseFull.assets.map((a) => generateWearableEntity(a.urn.decentraland)))

      const profilesComponent = await createProfilesComponent({
        alchemyNftFetcher,
        entitiesFetcher,
        metrics,
        content,
        contentServerUrl,
        theGraph,
        config,
        fetch,
        ownershipCaches,
        l1ThirdPartyItemChecker,
        l2ThirdPartyItemChecker,
        thirdPartyProvidersStorage,
        logs,
        wearablesFetcher,
        emotesFetcher,
        namesFetcher
      })
      const profiles = await profilesComponent.getProfiles([address])

      expect(profiles).toHaveLength(1)
      const profile = profiles[0]

      sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [address])

      expect(profile.avatars?.[0].avatar.wearables).toEqual([
        'urn:decentraland:off-chain:base-avatars:eyebrows_00',
        'urn:decentraland:off-chain:base-avatars:short_hair',
        'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7:3',
        'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1:3',
        'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:1',
        'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand:2',
        'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f',
        'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
      ])
    })
  }
)

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

  const wearables = [
    {
      urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
      id: 'id-3',
      tokenId: '1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-3',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
      id: 'id-4',
      tokenId: '1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-4',
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    },
    {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      id: 'id-1',
      tokenId: '1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-1',
          category: 'eyewear'
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
          category: 'eyewear'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    }
  ]

  const names = [
    {
      name: 'cryptonico',
      contractAddress: '0x2a187453064356c898df701890301b1a14de3f78e',
      tokenId: 'id1'
    }
  ]

  const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, names })

  return {
    config,
    marketplaceApiFetcher
  }
})(
  'integration tests for profile adapter: calling with a single profile address with extended items, ensuring ERC-721 and owning everything claimed',
  function ({ components, stubComponents }) {
    it('should work', async () => {
      const {
        metrics,
        config,
        contentServerUrl,
        ownershipCaches,
        thirdPartyProvidersStorage,
        logs,
        wearablesFetcher,
        emotesFetcher,
        namesFetcher,
        l1ThirdPartyItemChecker,
        l2ThirdPartyItemChecker
      } = components
      const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
      const address = '0x1'

      content.fetchEntitiesByPointers
        .withArgs([address])
        .resolves(await Promise.all([profileEntityFullWithExtendedItems]))
      theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation(async (_query: string) => {
        return {
          nfts: [
            {
              urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
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
              urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
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
        }
      })

      theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation(async (query: string) => {
        if (query.includes(`itemType_in: [wearable_v1, wearable_v2, smart_wearable_v1]`)) {
          return {
            nfts: [
              {
                urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
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
                urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
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
          }
        } else if (query.includes(`itemType: emote_v1`)) {
          return { nfts: [] }
        }
      })

      theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [{ id: 'id1', name: 'cryptonico' }] })

      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([
        {
          id: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta',
          resolver: 'https://api.swappable.io/api/v1',
          metadata: {
            thirdParty: {
              name: 'test',
              description: 'test'
            }
          }
        }
      ])
      fetch.fetch
        .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1/assets')
        .onCall(0)
        .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
        .onCall(1)
        .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      entitiesFetcher.fetchEntities
        .withArgs(tpwResolverResponseFull.assets.map((a) => a.urn.decentraland))
        .resolves(tpwResolverResponseFull.assets.map((a) => generateWearableEntity(a.urn.decentraland)))

      const profilesComponent = await createProfilesComponent({
        alchemyNftFetcher,
        entitiesFetcher,
        metrics,
        content,
        contentServerUrl,
        theGraph,
        config,
        fetch,
        ownershipCaches,
        l1ThirdPartyItemChecker,
        l2ThirdPartyItemChecker,
        thirdPartyProvidersStorage,
        logs,
        wearablesFetcher,
        emotesFetcher,
        namesFetcher
      })
      const profiles = await profilesComponent.getProfiles([address])
      expect(profiles).toHaveLength(1)

      const profile = profiles[0]

      sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [address])

      expect(profile.avatars.length).toEqual(1)

      expect(profile.avatars?.[0].avatar.wearables).toEqual([
        'urn:decentraland:off-chain:base-avatars:eyebrows_00',
        'urn:decentraland:off-chain:base-avatars:short_hair',
        'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7:1',
        'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1:1',
        'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:1',
        'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand:1',
        'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f',
        'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
      ])
    })
  }
)

testWithComponents(() => {
  const wearables = [
    {
      urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      id: 'id-1',
      tokenId: 'tokenId-1',
      category: 'wearable',
      transferredAt: Date.now(),
      metadata: {
        wearable: {
          name: 'name-1',
          category: 'feet'
        }
      },
      item: {
        rarity: 'unique',
        price: 100
      }
    }
  ]

  const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables })

  return { marketplaceApiFetcher }
})('integration tests for profile adapter', function ({ components, stubComponents }) {
  it('calling with a single profile address, two eth wearables, one of them not owned', async () => {
    const {
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      config,
      contentServerUrl,
      ownershipCaches,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker
    } = components
    const { theGraph, content, fetch } = stubComponents
    const addresses = ['0x3']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityTwoEthWearables]))

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const profilesComponent = await createProfilesComponent({
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      content,
      contentServerUrl,
      theGraph,
      config,
      fetch,
      ownershipCaches,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher
    })
    const profiles = await profilesComponent.getProfiles(addresses)
    expect(profiles.length).toEqual(1)
    expect(profiles[0].avatars.length).toEqual(1)
    expect(profiles[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(profiles[0].avatars?.[0].ethAddress).toEqual('0x3')
    expect(profiles[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(profiles[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(profiles[0].avatars?.[0].avatar.snapshots.body).toEqual(
      `https://peer.decentraland.org/content/entities/${profileEntityTwoEthWearables.id}/body.png`
    )
    expect(profiles[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      `https://peer.decentraland.org/content/entities/${profileEntityTwoEthWearables.id}/face.png`
    )
    expect(profiles[0].avatars?.[0].avatar.wearables).toEqual([
      'urn:decentraland:off-chain:base-avatars:eyebrows_00',
      'urn:decentraland:off-chain:base-avatars:short_hair',
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:tokenId-1'
    ])
  })
})

testWithComponents(() => {
  const wearables: any[] = []
  const emotes = [
    {
      urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
      id: 'emote-1',
      tokenId: '5',
      category: 'emote',
      transferredAt: Date.now(),
      metadata: {
        emote: {
          name: 'Dance Emote',
          category: 'dance'
        }
      },
      item: {
        rarity: 'rare',
        price: 50
      }
    },
    {
      urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:10',
      id: 'emote-2',
      tokenId: '10',
      category: 'emote',
      transferredAt: Date.now(),
      metadata: {
        emote: {
          name: 'Wave Emote',
          category: 'greetings'
        }
      },
      item: {
        rarity: 'epic',
        price: 100
      }
    }
  ]
  const names: any[] = []

  const { createMarketplaceApiFetcherMock } = require('../mocks/marketplace-api-mock')
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, emotes, names })

  return { marketplaceApiFetcher }
})('integration tests for profile adapter', function ({ components, stubComponents }) {
  it('calling with profile containing only base emotes', async () => {
    const {
      metrics,
      config,
      contentServerUrl,
      ownershipCaches,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker
    } = components
    const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
    const address = '0x20'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityWithBaseEmotes]))

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const profilesComponent = await createProfilesComponent({
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      content,
      contentServerUrl,
      theGraph,
      config,
      fetch,
      ownershipCaches,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher
    })

    const profiles = await profilesComponent.getProfiles([address])
    expect(profiles).toHaveLength(1)
    expect(profiles[0].avatars[0].avatar.emotes).toEqual([
      { slot: 0, urn: 'urn:decentraland:off-chain:base-emotes:wave' },
      { slot: 1, urn: 'urn:decentraland:off-chain:base-emotes:dance' }
    ])
  })

  it('calling with profile containing base emotes and owned emotes', async () => {
    const {
      metrics,
      config,
      contentServerUrl,
      ownershipCaches,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker
    } = components
    const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
    const address = '0x21'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityWithOwnedEmotes]))

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const profilesComponent = await createProfilesComponent({
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      content,
      contentServerUrl,
      theGraph,
      config,
      fetch,
      ownershipCaches,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher
    })

    const profiles = await profilesComponent.getProfiles([address])
    expect(profiles).toHaveLength(1)
    expect(profiles[0].avatars[0].avatar.emotes).toEqual([
      { slot: 0, urn: 'urn:decentraland:off-chain:base-emotes:wave' },
      { slot: 1, urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:5' },
      { slot: 2, urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:10:10' }
    ])
  })

  it('calling with profile containing mixed emotes including ones without colons', async () => {
    const {
      metrics,
      config,
      contentServerUrl,
      ownershipCaches,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker
    } = components
    const { alchemyNftFetcher, entitiesFetcher, theGraph, fetch, content } = stubComponents
    const address = '0x22'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityWithMixedEmotes]))

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const profilesComponent = await createProfilesComponent({
      alchemyNftFetcher,
      entitiesFetcher,
      metrics,
      content,
      contentServerUrl,
      theGraph,
      config,
      fetch,
      ownershipCaches,
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      thirdPartyProvidersStorage,
      logs,
      wearablesFetcher,
      emotesFetcher,
      namesFetcher
    })

    const profiles = await profilesComponent.getProfiles([address])
    expect(profiles).toHaveLength(1)
    expect(profiles[0].avatars[0].avatar.emotes).toEqual([
      { slot: 0, urn: 'urn:decentraland:off-chain:base-emotes:wave' },
      { slot: 1, urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:5' },
      { slot: 2, urn: 'clap' },
      { slot: 3, urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:10:10' }
    ])
  })
})
