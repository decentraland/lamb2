import { getOutfits } from '../../../src/logic/outfits'
import { test } from '../../components'
import { Entity, EntityType, Outfits } from '@dcl/schemas'
import * as namesOwnershipChecker from '../../../src/ports/ownership-checker/names-ownership-checker'
import * as wearablesOwnershipChecker from '../../../src/ports/ownership-checker/wearables-ownership-checker'

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
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address'],
      timestamp: 123,
      metadata: outfitsMetadata,
      content: []
    }
    const fetchEntitiesSpy = jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([outfitsEntity])
    const wearablesChecker = createAllOwnedOwnershipCheckerMock()
    const namesChecker = createAllOwnedOwnershipCheckerMock()
    jest.spyOn(wearablesOwnershipChecker, 'createWearablesOwnershipChecker').mockReturnValue(wearablesChecker)
    jest.spyOn(namesOwnershipChecker, 'createNamesOwnershipChecker').mockReturnValue(namesChecker)

    const outfits = await getOutfits(components, 'address')

    expect(outfits).toEqual(outfitsEntity)
    expect(fetchEntitiesSpy).toBeCalledWith(['address'])
  })
})

test('when some wearables are not owned, the outfits with those wearables are removed from entity', function ({ components }) {
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
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2',
          ownedWearable
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
        wearables: [
          ownedWearable
        ]
      }
    }
    const outfitsEntity: Entity = {
      id: 'entityId',
      version: 'v3',
      type: EntityType.OUTFITS,
      pointers: ['address'],
      timestamp: 123,
      metadata: {
        outfits: [
          outfitWithNotOwnedWearables,
          outfitWithOwnedWearables,

        ],
        namesForExtraSlots: []
      },
      content: []
    }
    jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([outfitsEntity])
    const wearablesChecker = createSpecificOwnedNftsOwnershipCheckerMock([ownedWearable])
    const namesChecker = createAllOwnedOwnershipCheckerMock()
    jest.spyOn(wearablesOwnershipChecker, 'createWearablesOwnershipChecker').mockReturnValue(wearablesChecker)
    jest.spyOn(namesOwnershipChecker, 'createNamesOwnershipChecker').mockReturnValue(namesChecker)

    const outfits = await getOutfits(components, 'address')
    expect(outfits.metadata.outfits).toEqual([outfitWithOwnedWearables])
  })
})

test('when some names are not owned, extra outfits and not owned names are removed from entity', function ({ components }) {
  it('run test', async () => {
    const anOutfit = {
      bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
      eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
      hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
      skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
      wearables: ['urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet']
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
    const wearablesChecker = createAllOwnedOwnershipCheckerMock()
    const namesChecker = createSpecificOwnedNftsOwnershipCheckerMock(ownedNames)
    jest.spyOn(wearablesOwnershipChecker, 'createWearablesOwnershipChecker').mockReturnValue(wearablesChecker)
    jest.spyOn(namesOwnershipChecker, 'createNamesOwnershipChecker').mockReturnValue(namesChecker)

    const outfits = await getOutfits(components, address)
    expect(outfits.metadata.outfits).toEqual([outfitSlot1, outfitExtraSlot5, outfitExtraSlot6])
    expect(outfits.metadata.namesForExtraSlots).toEqual(ownedNames)
  })
})


function createAllOwnedOwnershipCheckerMock() {
  const ownedNFTS = []
  return {
    addNFTsForAddress: (address: string, nfts: string[]) => {
      ownedNFTS.push(...nfts)
    },
    checkNFTsOwnership: jest.fn(),
    getOwnedNFTsForAddress: (address: string) => ownedNFTS
  }
}

function createSpecificOwnedNftsOwnershipCheckerMock(ownedNFTS: string[]) {
  return {
    addNFTsForAddress: jest.fn(),
    checkNFTsOwnership: jest.fn(),
    getOwnedNFTsForAddress: (address: string) => ownedNFTS
  }
}
