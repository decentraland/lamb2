import { Entity, EntityType, Outfits } from '@dcl/schemas'
import { test } from '../components'
import sinon from 'sinon'

const outfitsMetadataWithExtendedWearables: Outfits = {
  outfits: [
    {
      slot: 1,
      outfit: {
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
        hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
        skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
        wearables: [
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
          'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
        ]
      }
    },
    {
      slot: 5,
      outfit: {
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
        hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
        skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
        wearables: [
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
          'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
        ]
      }
    }
  ],
  namesForExtraSlots: ['perro']
}

const outfitsMetadataWithShortenedWearables: Outfits = {
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
      slot: 5,
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
  namesForExtraSlots: ['perro']
}

const outfitsMetadataWithMixedWearables: Outfits = {
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
      slot: 5,
      outfit: {
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
        hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
        skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
        wearables: [
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
          'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
        ]
      }
    }
  ],
  namesForExtraSlots: ['perro']
}

test('integration tests for /outfits/{owner}', ({ components, stubComponents }) => {
  it('should return whole outfit when shortened wearables are owned', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadataWithShortenedWearables,
      content: []
    }

    content.fetchEntitiesByPointers.withArgs([`${address}:outfits`]).resolves(await Promise.all([outfitsEntity]))
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [{ urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet', tokenId: '123' }]
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0', tokenId: '123' },
          { urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2', tokenId: '123' }
        ]
      })
    theGraph.ensSubgraph.query = sinon.stub().withArgs(sinon.match.string, sinon.match.object).resolves({ P0x1: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)
    const responseAsObject = await response.json()

    expect(response.status).toEqual(200)
    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [`${address}:outfits`])
    expect(responseAsObject).toEqual(outfitsEntity)
  })
})

test('integration tests for /outfits/{owner}', ({ components, stubComponents }) => {
  it('should return whole outfit when extended wearables are owned', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadataWithExtendedWearables,
      content: []
    }

    content.fetchEntitiesByPointers.withArgs([`${address}:outfits`]).resolves(await Promise.all([outfitsEntity]))
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [{ urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet', tokenId: '123' }]
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0', tokenId: '123' },
          { urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2', tokenId: '123' }
        ]
      })
    theGraph.ensSubgraph.query = sinon.stub().withArgs(sinon.match.string, sinon.match.object).resolves({ P0x1: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)
    const responseAsObject = await response.json()

    expect(response.status).toEqual(200)
    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [`${address}:outfits`])
    expect(responseAsObject).toEqual(outfitsEntity)
  })
})

test('integration tests for /outfits/{owner}', ({ components, stubComponents }) => {
  it('should return whole outfit when mixed wearables (extended and shortened) are owned', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadataWithMixedWearables,
      content: []
    }

    content.fetchEntitiesByPointers.withArgs([`${address}:outfits`]).resolves(await Promise.all([outfitsEntity]))
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [{ urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet', tokenId: '123' }]
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0', tokenId: '123' },
          { urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2', tokenId: '123' }
        ]
      })
    theGraph.ensSubgraph.query = sinon.stub().withArgs(sinon.match.string, sinon.match.object).resolves({ P0x1: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)
    const responseAsObject = await response.json()

    expect(response.status).toEqual(200)
    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [`${address}:outfits`])
    expect(responseAsObject).toEqual(outfitsEntity)
  })
})

test('integration tests for /outfits/{owner}', ({ components, stubComponents }) => {
  it('should return whole outfit containing extended wearables urn when shortened wearables owned are passed and erc721 query param is sent', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadataWithShortenedWearables,
      content: []
    }

    const expectedOutfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadataWithExtendedWearables,
      content: []
    }

    content.fetchEntitiesByPointers.withArgs([`${address}:outfits`]).resolves(await Promise.all([outfitsEntity]))
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [{ urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet', tokenId: '123' }]
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [
          { urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0', tokenId: '123' },
          { urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2', tokenId: '123' }
        ]
      })
    theGraph.ensSubgraph.query = sinon.stub().withArgs(sinon.match.string, sinon.match.object).resolves({ P0x1: [] })

    const response = await localFetch.fetch(`/outfits/${address}?erc721`)
    const responseAsObject = await response.json()

    expect(response.status).toEqual(200)
    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [`${address}:outfits`])
    expect(responseAsObject).toEqual(expectedOutfitsEntity)
  })
})

test('integration tests for /outfits/{owner}', ({ components, stubComponents }) => {
  it('CUSTOM CASE: should return whole outfit containing a single shortened urn + base wearables when shortened wearables owned are passed', async () => {
    const { localFetch } = components
    const { theGraph, fetch, content } = stubComponents
    const address = '0x1'

    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: {
        outfits: [
          {
            slot: 0,
            outfit: {
              bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
              eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
              hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
              skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
              wearables: [
                'urn:decentraland:off-chain:base-avatars:moptop',
                'urn:decentraland:off-chain:base-avatars:f_eyes_05',
                'urn:decentraland:off-chain:base-avatars:mouth_07',
                'urn:decentraland:off-chain:base-avatars:old_mustache_beard',
                'urn:decentraland:off-chain:base-avatars:basketball_shorts',
                'urn:decentraland:off-chain:base-avatars:eyebrows_12',
                'urn:decentraland:matic:collections-v2:0x26ea2f6a7273a2f28b410406d1c13ff7d4c9a162:6',
                'urn:decentraland:off-chain:base-avatars:bear_slippers',
                'urn:decentraland:off-chain:base-avatars:black_sun_glasses'
              ]
            }
          }
        ],
        namesForExtraSlots: []
      },
      content: []
    }

    const expectedOutfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: {
        outfits: [
          {
            slot: 0,
            outfit: {
              bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
              eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
              hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
              skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
              wearables: [
                'urn:decentraland:off-chain:base-avatars:moptop',
                'urn:decentraland:off-chain:base-avatars:f_eyes_05',
                'urn:decentraland:off-chain:base-avatars:mouth_07',
                'urn:decentraland:off-chain:base-avatars:old_mustache_beard',
                'urn:decentraland:off-chain:base-avatars:basketball_shorts',
                'urn:decentraland:off-chain:base-avatars:eyebrows_12',
                'urn:decentraland:matic:collections-v2:0x26ea2f6a7273a2f28b410406d1c13ff7d4c9a162:6',
                'urn:decentraland:off-chain:base-avatars:bear_slippers',
                'urn:decentraland:off-chain:base-avatars:black_sun_glasses'
              ]
            }
          }
        ],
        namesForExtraSlots: []
      },
      content: []
    }

    content.fetchEntitiesByPointers.withArgs([`${address}:outfits`]).resolves(await Promise.all([outfitsEntity]))
    theGraph.ethereumCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: []
      })
    theGraph.maticCollectionsSubgraph.query = sinon
      .stub()
      .withArgs(sinon.match.string, sinon.match.object)
      .resolves({
        P0x1: [
          {
            urn: 'urn:decentraland:matic:collections-v2:0x26ea2f6a7273a2f28b410406d1c13ff7d4c9a162:6',
            tokenId: '631873750011343120187508166102022593913370572403294667525865865549'
          }
        ]
      })
    theGraph.ensSubgraph.query = sinon.stub().withArgs(sinon.match.string, sinon.match.object).resolves({ P0x1: [] })

    const response = await localFetch.fetch(`/outfits/${address}`)
    const responseAsObject = await response.json()

    expect(response.status).toEqual(200)
    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, [`${address}:outfits`])
    expect(responseAsObject).toMatchObject(expectedOutfitsEntity)
  })
})
