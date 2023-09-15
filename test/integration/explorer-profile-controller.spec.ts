import { test } from '../components'
import { Response } from 'node-fetch'
import sinon from 'sinon'
import { profileEntityFull, tpwResolverResponseFull } from './data/profiles-responses'
import { WearableCategory } from '@dcl/schemas'
import { hashV1 } from '@dcl/hashing'

test('integration tests for /explorer/profile/{id}', function ({ components, stubComponents }) {
  it('should hash properly', async () => {
    const { localFetch, identity } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityFull]))
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockImplementation((_query: string) => {
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

    const response = await localFetch.fetch(`/explorer/profiles/${address}`)

    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [address])

    expect(response.status).toEqual(200)
    const { profile, hash, signedHash } = await response.json()

    expect(profile.avatars.length).toEqual(1)
    expect(profile.avatars?.[0].hasClaimedName).toEqual(true)
    expect(profile.avatars?.[0].ethAddress).toEqual('0x1')
    expect(profile.avatars?.[0].name).toEqual('cryptonico')
    expect(profile.avatars?.[0].unclaimedName).toBeUndefined()
    expect(profile.avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(profile.avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(profile.avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )

    const wearables = [
      'urn:decentraland:off-chain:base-avatars:eyebrows_00',
      'urn:decentraland:off-chain:base-avatars:short_hair',
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7',
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1',
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet',
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand',
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f',
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
    ]
    expect(profile.avatars?.[0].avatar.wearables).toEqual(wearables)

    expect(hash).toBeTruthy()
    expect(signedHash).toBeTruthy()

    const payload = new TextEncoder().encode(JSON.stringify(['cryptonico', true, ...wearables]))
    expect(hash).toEqual(await hashV1(payload))
    expect(signedHash).toEqual(identity.sign(hash))
  })
})
