import { test } from '../components'
import { Response } from 'node-fetch'
import sinon from 'sinon'
import {
  profileEntityFull,
  profileEntityFullAnother,
  profileEntityFullB,
  profileEntityOldBodyshape,
  profileEntitySeveralTPWFromDifferentCollections,
  profileEntitySnapshotsReferenceContentFile,
  profileEntityTwoEthWearables,
  profileEntityTwoMaticWearables,
  profileEntityTwoTPWFromSameCollection,
  profileEntityWithClaimedName,
  profileEntityWithNewTimestamp,
  profileEntityWithOldTimestamp,
  profileEntityWithoutNFTs,
  tpwResolverResponseFromDifferentCollection,
  tpwResolverResponseFull,
  tpwResolverResponseFullAnother,
  tpwResolverResponseOwnOnlyOne
} from './data/profiles-responses'
import { WearableCategory } from '@dcl/schemas'

test('integration tests for /profiles', function ({ components, stubComponents }) {
  it('calling without body should return 500', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/profiles', { method: 'post' })

    expect(r.status).toEqual(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })

  it('calling with an empty body should return 500', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/profiles', { method: 'post', body: '' })

    expect(r.status).toEqual(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })

  it('calling with body with empty object should return 400', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/profiles', { method: 'post', body: '{}' })

    expect(r.status).toEqual(400)
    expect(await r.json()).toEqual({
      error: 'Bad request',
      message: 'No profile ids were specified. Expected ids:string[] in body'
    })
  })

  it('calling with an empty list', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/profiles', { method: 'post', body: '{"ids":[]}' })

    expect(r.status).toEqual(200)
    expect(await r.json()).toEqual([])
  })

  it('calling with a single profile address, owning everything claimed', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const addresses = ['0x1']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityFull]))
    const wearablesQuery =
      '{\n        P0x1: nfts(where: { owner: "0x1", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: ["urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7","urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1","urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet","urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand","urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f","urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393"] }, first: 1000) {\n        urn\n        }\n    }'

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: [
          {
            urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
            id: 'id-1',
            tokenId: 'tokenId-1',
            category: 'wearable',
            transferredAt: Date.now(),
            metadata: {
              wearable: {
                name: 'name-1',
                category: WearableCategory.FEET
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
                category: WearableCategory.HANDS_WEAR
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
              urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
              id: 'id-3',
              tokenId: 'tokenId-3',
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
              id: 'id-3',
              tokenId: 'tokenId-3',
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

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x1: [{ name: 'cryptonico' }] })

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

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, addresses)

    expect(response.status).toEqual(200)
    const responseObj = await response.json()
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x1')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(8)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
    )
  })

  it('calling with a single profile address, without nfts', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x2']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityWithoutNFTs]))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x2: [] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x2')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it('calling with a single profile address, two eth wearables, one of them not owned', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x3']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityTwoEthWearables]))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({
      nfts: [
        {
          urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
          id: 'id-1',
          tokenId: 'tokenId-1',
          category: 'wearable',
          transferredAt: Date.now(),
          metadata: {
            wearable: {
              name: 'name-1',
              category: WearableCategory.FEET
            }
          },
          item: {
            rarity: 'unique',
            price: 100
          }
        }
      ]
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x3: [] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x3')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(3)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
  })

  it('calling with a single profile address, two matic wearables, one of them not owned', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x4']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityTwoMaticWearables]))
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
              urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
              id: 'id-3',
              tokenId: 'tokenId-3',
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

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x4: [] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x4')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(3)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1'
    )
  })

  it('calling with a single profile address, owning claimed name', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x5']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityWithClaimedName]))
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x5: [{ name: 'cryptonico' }] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x5')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it('calling with a single profile address, two tpw wearables from same collection, one of them not owned', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const addresses = ['0x6']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntityTwoTPWFromSameCollection]))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x6: [{ name: 'cryptonico' }] })

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
      .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x6/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x6')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(3)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
  })

  it('calling with a single profile address, five tpw wearables from two different collections, two of them not owned', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const addresses = ['0x7']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntitySeveralTPWFromDifferentCollections]))
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x7: [] })

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
      },
      {
        id: 'urn:decentraland:matic:collections-thirdparty:ntr2-meta',
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
      .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x7/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .withArgs('https://api.swappable.io/api/v1/registry/ntr2-meta/address/0x7/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
      .onCall(2)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x7')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(5)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393'
    )
  })

  it('calling with two profile addresses, owning everything claimed', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const addresses = ['0x1b', '0x8']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntityFullB, profileEntityFullAnother]))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string, variables: any) => {
      if (variables.owner === '0x1b') {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
              id: 'id-1',
              tokenId: 'tokenId-1',
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
              tokenId: 'tokenId-2',
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
      } else if (variables.owner === '0x8') {
        return Promise.resolve({
          nfts: [
            {
              urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat',
              id: 'id-3',
              tokenId: 'tokenId-1',
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
              urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt',
              id: 'id-4',
              tokenId: 'tokenId-2',
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
      }
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string, variables: any) => {
      if (query.includes(`category: "wearable"`)) {
        if (variables.owner === '0x1b') {
          return Promise.resolve({
            nfts: [
              {
                urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
                id: 'id-3',
                tokenId: 'tokenId-3',
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
                id: 'id-3',
                tokenId: 'tokenId-3',
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
        } else if (variables.owner === '0x8') {
          return Promise.resolve({
            nfts: [
              {
                urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6',
                id: 'id-6',
                tokenId: 'tokenId-3',
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
                urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2',
                id: 'id-7',
                tokenId: 'tokenId-3',
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
        }
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockImplementation((query: string, variables: any) => {
      if (query.includes('P0x1b')) {
        return Promise.resolve({ P0x1b: [{ name: 'cryptonico' }] })
      } else if (query.includes('P0x8')) {
        return Promise.resolve({ P0x1b: [{ name: 'testing' }] })
      }
    })

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
      },
      {
        id: 'urn:decentraland:matic:collections-thirdparty:ntr2-meta',
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
      .withArgs('https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1b/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .withArgs('https://api.swappable.io/api/v1/registry/ntr2-meta/address/0x8/assets')
      .onCall(0)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFullAnother)))
      .onCall(1)
      .resolves(new Response(JSON.stringify(tpwResolverResponseFullAnother)))

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(2)

    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x1b')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(8)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
    )

    expect(responseObj[1].avatars.length).toEqual(1)
    expect(responseObj[1].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[1].avatars?.[0].ethAddress).toEqual('0x8')
    expect(responseObj[1].avatars?.[0].name).toEqual('testing')
    expect(responseObj[1].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[1].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseFemale')
    expect(responseObj[1].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lue'
    )
    expect(responseObj[1].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2me'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables.length).toEqual(8)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:off-chain:base-avatars:eyebrows_00'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:w3499wer-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:12341234-9876-3434-3434-f9dfde9f9393'
    )
  })

  it('calling with a single profile address with old body shape format', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x9']

    content.fetchEntitiesByPointers.withArgs(addresses).resolves(await Promise.all([profileEntityOldBodyshape]))
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x9: [] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x9')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseFemale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it('calling with a single profile address with snapshots referencing content', async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x10']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntitySnapshotsReferenceContentFile]))
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockResolvedValue({ P0x10: [] })

    const response = await localFetch.fetch('/profiles', { method: 'post', body: JSON.stringify({ ids: addresses }) })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x10')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/qwerqwerqwerqwerqwerqwerqwerqwerqwerqwerqwerqwerqwerqwerqwe'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasd'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it("calling with two profiles, with if-modified-since header, with one of them modified after the header's date", async () => {
    const { localFetch } = components
    const { theGraph, content } = stubComponents
    const addresses = ['0x11', '0x12']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntityWithOldTimestamp, profileEntityWithNewTimestamp]))

    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        nfts: []
      })
    })

    theGraph.maticCollectionsSubgraph.query = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`category: "wearable"`)) {
        return Promise.resolve({
          nfts: []
        })
      } else if (query.includes(`category: "emote"`)) {
        return Promise.resolve({ nfts: [] })
      }
    })

    theGraph.ensSubgraph.query = jest.fn().mockImplementation((query: string, variables: any) => {
      if (query.includes('P0x11')) {
        return Promise.resolve({ P0x11: [] })
      } else if (query.includes('P0x12')) {
        return Promise.resolve({ P0x12: [] })
      }
    })

    const response = await localFetch.fetch('/profiles', {
      method: 'post',
      body: JSON.stringify({ ids: addresses }),
      headers: { 'If-Modified-Since': 'Mon Jul 11 2022 15:53:46 GMT-0300 (Argentina Standard Time)' }
    })

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(2)

    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual('0x11')
    expect(responseObj[0].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)

    expect(responseObj[1].avatars.length).toEqual(1)
    expect(responseObj[1].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[1].avatars?.[0].ethAddress).toEqual('0x12')
    expect(responseObj[1].avatars?.[0].name).toEqual('cryptonico#e602')
    expect(responseObj[1].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[1].avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj[1].avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj[1].avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj[1].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it("calling with two profiles, with if-modified-since header, with both of them modified before the header's date", async () => {
    const { localFetch } = components
    const { content } = stubComponents
    const addresses = ['0x11', '0x12']

    content.fetchEntitiesByPointers
      .withArgs(addresses)
      .resolves(await Promise.all([profileEntityWithOldTimestamp, profileEntityWithNewTimestamp]))

    const response = await localFetch.fetch('/profiles', {
      method: 'post',
      body: JSON.stringify({ ids: addresses }),
      headers: { 'If-Modified-Since': 'Mon Jul 11 2023 15:53:46 GMT-0300 (Argentina Standard Time)' }
    })

    expect(response.status).toEqual(304)
    const responseText = await response.text()
    expect(responseText).toEqual('')
  })
})
