import { test } from '../components'
import { Response } from 'node-fetch'
import sinon from 'sinon'
import { profileEntityFull, tpwResolverResponseFull } from './data/profiles-responses'
import { WearableCategory } from '@dcl/schemas'

test('integration tests for /profile/{id}', function ({ components, stubComponents }) {
  it('calling with a single profile address, owning everything claimed', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    content.fetchEntitiesByPointers.withArgs([address]).resolves(await Promise.all([profileEntityFull]))
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

    const response = await localFetch.fetch(`/profiles/${address}`)

    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [address])

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.avatars.length).toEqual(1)
    expect(responseObj.avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj.avatars?.[0].ethAddress).toEqual('0x1')
    expect(responseObj.avatars?.[0].name).toEqual('cryptonico')
    expect(responseObj.avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj.avatars?.[0].avatar.bodyShape).toEqual('urn:decentraland:off-chain:base-avatars:BaseMale')
    expect(responseObj.avatars?.[0].avatar.snapshots.body).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua'
    )
    expect(responseObj.avatars?.[0].avatar.snapshots.face256).toEqual(
      'https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma'
    )
    expect(responseObj.avatars?.[0].avatar.wearables.length).toEqual(8)
    expect(responseObj.avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:eyebrows_00')
    expect(responseObj.avatars?.[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
    )
  })
})
