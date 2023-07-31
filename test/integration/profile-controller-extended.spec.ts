import { test } from '../components'
import { Response } from 'node-fetch'
import sinon from 'sinon'
import { completeProfileEntityWithExtendedURNs, tpwResolverResponseFull } from './data/profiles-responses'

test('integration tests for /profile/{id}?erc721', function ({ components, stubComponents }) {
  it('calling with a single profile address, owning everything claimed', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    content.fetchEntitiesByPointers
      .withArgs([address])
      .resolves(await Promise.all([completeProfileEntityWithExtendedURNs]))
    const wearablesQuery =
      '{\n        P0x1: nfts(where: { owner: "0x1", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: ["urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7","urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1","urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet","urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand","urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f","urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393"] }, first: 1000) {\n        urn\n        }\n    }'
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(wearablesQuery, {})
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet', tokenId: '123' },
          { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand', tokenId: '123' }
        ]
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(wearablesQuery, {})
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7', tokenId: '123' },
          { urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1', tokenId: '123' }
        ]
      })

    const namesQuery =
      '{\n      P0x1: nfts(where: { owner: "0x1", category: ens, name_in: ["cryptonico"] }, first: 1000) {\n        name\n      }\n    }'
    theGraph.ensSubgraph.query = sinon
      .stub()
      .withArgs(namesQuery, {})
      .resolves({ P0x1: [{ name: 'cryptonico' }] })

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

    const response = await localFetch.fetch(`/profiles/${address}?erc721`)

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
      'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7:123'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1:123'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:123'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'
    )
    expect(responseObj.avatars?.[0].avatar.wearables).toContain(
      'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393'
    )
  })
})
