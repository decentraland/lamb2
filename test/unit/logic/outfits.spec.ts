import { getOutfits } from '../../../src/logic/outfits'
import { test } from '../../components'
import { Entity, EntityType, Outfits } from '@dcl/schemas'

test('when getting outfits', function ({ components }) {
  const createOutfit = (slot: number, wearables: string[]) => ({
    slot,
    outfit: {
      bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
      eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
      hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
      skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
      wearables
    }
  })

  const getExpectedOutfit = (slot: number, wearables: string[]) => ({
    slot,
    outfit: {
      bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
      eyes: { color: { r: 0.23046875, g: 0.625, b: 0.3125 } },
      hair: { color: { r: 0.35546875, g: 0.19140625, b: 0.05859375 } },
      skin: { color: { r: 0.94921875, g: 0.76171875, b: 0.6484375 } },
      wearables: wearables.map((w) => w.toLowerCase())
    }
  })

  describe('and no outfits entities are found', () => {
    let ethAddress: string

    beforeEach(() => {
      ethAddress = '0x123'
      jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([])
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should return undefined', async () => {
      const result = await getOutfits(components, ethAddress)

      expect(result).toBeUndefined()
      expect(components.content.fetchEntitiesByPointers).toHaveBeenCalledWith([`${ethAddress}:outfits`])
    })
  })

  describe('and outfits entity exists', () => {
    let ethAddress: string
    let outfitsEntity: Entity

    beforeEach(() => {
      ethAddress = '0x123'
      outfitsEntity = {
        id: 'entityId',
        version: 'v3',
        type: EntityType.OUTFITS,
        pointers: [`${ethAddress}:outfits`],
        timestamp: 123,
        metadata: {
          outfits: [],
          namesForExtraSlots: []
        },
        content: []
      }
      jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue([outfitsEntity])
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    describe('and the metadata is empty', () => {
      beforeEach(() => {
        outfitsEntity.metadata = undefined
      })

      it('should return the entity without modifications', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result).toEqual(outfitsEntity)
      })
    })

    describe('and the outfits array is empty', () => {
      it('should return the entity without modifications', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result).toEqual(outfitsEntity)
      })
    })

    describe('and the user owns all wearables in normal slots', () => {
      beforeEach(() => {
        components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [
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
          ],
          totalAmount: 3
        })

        outfitsEntity.metadata.outfits.push(
          createOutfit(1, [
            'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
            'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
            'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
          ]),
          createOutfit(5, [
            'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
            'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
            'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
          ])
        )
      })

      describe('and the user owns names', () => {
        beforeEach(() => {
          outfitsEntity.metadata.namesForExtraSlots.push('perro')
          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [{ name: 'perro' }],
            totalAmount: 1
          })
        })

        it('should return both normal and extra outfits with wearables in lowercase', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result).toEqual({
            ...outfitsEntity,
            metadata: {
              outfits: outfitsEntity.metadata.outfits.map((o) => ({
                ...o,
                outfit: {
                  ...o.outfit,
                  wearables: o.outfit.wearables.map((w) => w.toLowerCase())
                }
              })),
              namesForExtraSlots: ['perro']
            }
          })
        })
      })

      describe('and the user does not own names', () => {
        beforeEach(() => {
          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })
        })

        it('should return only normal slots and exclude extra slots', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result?.metadata.outfits).toHaveLength(1)
          expect(result?.metadata.outfits[0]).toEqual(
            getExpectedOutfit(1, [
              'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
              'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:123',
              'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123'
            ])
          )
          expect(result?.metadata.namesForExtraSlots).toEqual([])
        })
      })
    })

    describe('and some wearables are not owned', () => {
      let ownedWearable: string
      let notOwnedWearables: string[]
      let ownedOutfitWearables: string[]

      beforeEach(() => {
        ownedWearable = 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet'
        notOwnedWearables = [
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:11',
          'urn:decentraland:matic:collections-v2:0x04e7f74e73e951c61edd80910e46c3fece5ebe80:2:12'
        ]
        ownedOutfitWearables = [`${ownedWearable}:123`]

        outfitsEntity.metadata.outfits.push(
          createOutfit(1, [...notOwnedWearables, `${ownedWearable}:123`]),
          createOutfit(2, ownedOutfitWearables)
        )

        components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
        components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [{ urn: ownedWearable, individualData: [{ tokenId: '123' }] }],
          totalAmount: 1
        })
      })

      it('should return only outfits where all wearables are owned', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result?.metadata.outfits).toHaveLength(1)
        expect(result?.metadata.outfits[0]).toEqual(getExpectedOutfit(2, ownedOutfitWearables))
      })
    })

    describe('and the entity has multiple names', () => {
      let ownedNames: string[]

      beforeEach(() => {
        ownedNames = ['iamowned', 'owned2']
        outfitsEntity.metadata.namesForExtraSlots.push(...ownedNames, 'notOwnedName')
      })

      describe('and some names are not owned by the user', () => {
        let outfitWearables: string[]

        beforeEach(() => {
          outfitWearables = ['urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet:123']

          outfitsEntity.metadata.outfits.push(
            createOutfit(1, outfitWearables),
            createOutfit(5, outfitWearables),
            createOutfit(6, outfitWearables),
            createOutfit(9, outfitWearables)
          )

          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: ownedNames.map((name) => ({ name })),
            totalAmount: ownedNames.length
          })
          components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [
              {
                urn: 'urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:p_rtfkt_x_atari_feet',
                individualData: [{ tokenId: '123' }]
              }
            ],
            totalAmount: 1
          })
        })

        it('should return all extra slots when the user owns at least one name', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result?.metadata.outfits).toHaveLength(4)
          expect(result?.metadata.outfits).toEqual([
            getExpectedOutfit(1, outfitWearables),
            getExpectedOutfit(5, outfitWearables),
            getExpectedOutfit(6, outfitWearables),
            getExpectedOutfit(9, outfitWearables)
          ])
          expect(result?.metadata.namesForExtraSlots).toEqual(ownedNames)
        })
      })
    })

    describe('and the outfits contain off-chain wearables', () => {
      beforeEach(() => {
        outfitsEntity.metadata.outfits.push(
          createOutfit(1, [
            'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
            'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer'
          ])
        )

        components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
        components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
      })

      it('should include the outfit without checking ownership', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result?.metadata.outfits).toHaveLength(1)
        expect(result?.metadata.outfits[0].outfit.wearables).toEqual([
          'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
          'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer'
        ])
      })
    })

    describe('and the outfits contain base-avatars wearables', () => {
      beforeEach(() => {
        outfitsEntity.metadata.outfits.push(
          createOutfit(1, ['urn:decentraland:base-avatars:eyebrows_00', 'urn:decentraland:base-avatars:eyes_00'])
        )

        components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
        components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
      })

      it('should include the outfit without checking ownership', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result?.metadata.outfits).toHaveLength(1)
        expect(result?.metadata.outfits[0].outfit.wearables).toEqual([
          'urn:decentraland:base-avatars:eyebrows_00',
          'urn:decentraland:base-avatars:eyes_00'
        ])
      })
    })

    describe('and the outfits contain mixed wearable types', () => {
      beforeEach(() => {
        outfitsEntity.metadata.outfits.push(
          createOutfit(1, [
            'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
            'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
            'urn:decentraland:base-avatars:eyebrows_00'
          ])
        )

        components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [],
          totalAmount: 0
        })
        components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
          elements: [
            {
              urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
              individualData: [{ tokenId: '123' }]
            }
          ],
          totalAmount: 1
        })
      })

      it('should include the outfit when all on-chain wearables are owned', async () => {
        const result = await getOutfits(components, ethAddress)

        expect(result?.metadata.outfits).toHaveLength(1)
        expect(result?.metadata.outfits[0].outfit.wearables).toEqual([
          'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
          'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
          'urn:decentraland:base-avatars:eyebrows_00'
        ])
      })
    })

    describe('and the outfits contain third party wearables', () => {
      describe('and the user owns all third party wearables', () => {
        let thirdPartyWearables: string[]

        beforeEach(() => {
          thirdPartyWearables = [
            'urn:decentraland:matic:collections-thirdparty:cryptohats:collection-1:hat-1:matic:0xabc123:1',
            'urn:decentraland:matic:collections-thirdparty:cryptohats:collection-1:shirt-2:matic:0xabc123:2'
          ]

          outfitsEntity.metadata.outfits.push(createOutfit(1, thirdPartyWearables))

          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })
          components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })

          // Clear the TPW cache to avoid interference
          components.ownershipCaches.tpwCache.clear()

          // Mock third-party item checkers to return true for all items
          components.l2ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([true, true])
          components.l1ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([])
        })

        it('should include the outfit with third party wearables in lowercase', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result?.metadata.outfits).toHaveLength(1)
          expect(result?.metadata.outfits[0]).toEqual(getExpectedOutfit(1, thirdPartyWearables))
        })
      })

      describe('and the user does not own all third party wearables', () => {
        let notOwnedWearable: string

        beforeEach(() => {
          notOwnedWearable =
            'urn:decentraland:matic:collections-thirdparty:cryptohats:collection-1:shirt-2:matic:0xabc123:2'

          outfitsEntity.metadata.outfits.push(createOutfit(1, [notOwnedWearable]))

          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })
          components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })

          // Clear the TPW cache to avoid interference
          components.ownershipCaches.tpwCache.clear()

          // Mock third-party item checkers to return false (not owned)
          components.l2ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([false])
          components.l1ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([])
        })

        it('should not include outfits with unowned third party wearables', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result?.metadata.outfits).toHaveLength(0)
        })
      })

      describe('and the outfit contains both on-chain and third party wearables', () => {
        let mixedWearables: string[]

        beforeEach(() => {
          mixedWearables = [
            'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0:123',
            'urn:decentraland:matic:collections-thirdparty:cryptohats:collection-1:hat-1:matic:0xabc123:1',
            'urn:decentraland:off-chain:base-avatars:eyebrows_00'
          ]

          outfitsEntity.metadata.outfits.push(createOutfit(1, mixedWearables))

          components.namesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [],
            totalAmount: 0
          })
          components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: [
              {
                urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
                individualData: [{ tokenId: '123' }]
              }
            ],
            totalAmount: 1
          })

          // Clear the TPW cache to avoid interference
          components.ownershipCaches.tpwCache.clear()

          // Mock third-party item checkers to return true for the one item
          components.l2ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([true])
          components.l1ThirdPartyItemChecker.checkThirdPartyItems = jest.fn().mockResolvedValue([])
        })

        it('should include the outfit when both on-chain and third party wearables are owned', async () => {
          const result = await getOutfits(components, ethAddress)

          expect(result?.metadata.outfits).toHaveLength(1)
          expect(result?.metadata.outfits[0]).toEqual(getExpectedOutfit(1, mixedWearables))
        })
      })
    })
  })
})
