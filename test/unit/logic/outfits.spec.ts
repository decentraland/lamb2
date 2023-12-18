import { getOutfits } from '../../../src/logic/outfits'
import { test } from '../../components'
import { Entity, EntityType, Outfits } from '@dcl/schemas'

test('when all wearables and names are owned, outfits entity is not modified', function ({ components }) {
  it('run test', async () => {
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
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address:outfits'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }
    const fetchEntitiesSpy = jest
      .spyOn(components.content, 'fetchEntitiesByPointers')
      .mockResolvedValue([outfitsEntity])

    components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([{ name: 'perro' }])

    components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([
      {
        urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
        individualData: [{ tokenId: '123' }]
      },
      {
        urn: 'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
        individualData: [{ tokenId: '123' }]
      },
      {
        urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
        individualData: [{ tokenId: '123' }]
      }
    ])

    const outfits = await getOutfits(components, 'address')

    expect(outfits).toEqual(outfitsEntity)
    expect(fetchEntitiesSpy).toBeCalledWith(['address:outfits'])
  })
})

test('when some wearables are not owned, the outfits with those wearables are removed from entity', function ({
  components
}) {
  it('run test', async () => {
    const ownedWearable = 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
    const outfitWithNotOwnedWearables = {
      slot: 1,
      outfit: {
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
        hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
        skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
        wearables: [
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:11',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:12',
          ownedWearable + ':123'
        ]
      }
    }
    const outfitWithOwnedWearables = {
      slot: 2,
      outfit: {
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
        hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
        skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
        wearables: [ownedWearable + ':123']
      }
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address'],
      timestamp: 123,
      metadata: {
        outfits: [outfitWithNotOwnedWearables, outfitWithOwnedWearables],
        namesForExtraSlots: []
      },
      content: []
    }
    jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([outfitsEntity])
    components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([])
    components.wearablesFetcher.fetchOwnedElements = jest
      .fn()
      .mockResolvedValue([{ urn: ownedWearable, individualData: [{ tokenId: '123' }] }])

    const outfits = await getOutfits(components, 'address')
    expect(outfits.metadata.outfits).toEqual([outfitWithOwnedWearables])
  })
})

test('when some names are not owned, extra outfits and not owned names are removed from entity', function ({
  components
}) {
  it('run test', async () => {
    const anOutfit = {
      bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
      eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
      hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
      skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
      wearables: ['urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123']
    }
    const ownedNames = ['iamowned', 'owned2']
    const outfitSlot1 = { slot: 1, outfit: { ...anOutfit } }
    const outfitExtraSlot5 = { slot: 5, outfit: { ...anOutfit } }
    const outfitExtraSlot6 = { slot: 6, outfit: { ...anOutfit } }
    const outfitExtraSlot9 = { slot: 9, outfit: { ...anOutfit } }
    const outfitsMetadata: Outfits = {
      outfits: [outfitSlot1, outfitExtraSlot5, outfitExtraSlot6, outfitExtraSlot9],
      namesForExtraSlots: [...ownedNames, 'notOwnedName']
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }
    const address = 'address'

    jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([outfitsEntity])
    components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(ownedNames.map((name) => ({ name })))

    components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([
      {
        urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
        individualData: [{ tokenId: '123' }]
      }
    ])

    const outfits = await getOutfits(components, address)
    expect(outfits.metadata.outfits).toEqual([outfitSlot1, outfitExtraSlot5, outfitExtraSlot6])
    expect(outfits.metadata.namesForExtraSlots).toEqual(ownedNames)
  })
})
