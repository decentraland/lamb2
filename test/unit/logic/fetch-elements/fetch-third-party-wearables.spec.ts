import { test } from '../../../components'
import { fetchAllThirdPartyWearables } from '../../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { getThirdPartyProviders } from '../../../data/wearables'
import { WearableCategory } from '@dcl/schemas'

describe('fetchAllThirdPartyWearables', () => {
  test('should fetch all owned third party wearables from a single provider', function ({ components }) {
    it('run test', async () => {
      const ownedNfts = ['mainnet:0xa:1', 'mainnet:0xa:2']
      const providerId = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(getThirdPartyProviders())
      jest.spyOn(components.alchemyNftFetcher, 'getNFTsForOwner').mockResolvedValue(ownedNfts)
      jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                total: 1,
                entities: [
                  {
                    id: 'entityIdA',
                    metadata: {
                      id: `${providerId}:entityIdA`,
                      name: 'nameForentityIdA',
                      data: {
                        category: WearableCategory.EARRING
                      },
                      mappings: {
                        mainnet: {
                          '0xa': [
                            {
                              type: 'multiple',
                              ids: ['1', '2']
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              })
          })
        ) as jest.Mock
      )

      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(wearables).toEqual([
        expect.objectContaining({
          amount: 2,
          individualData: [
            expect.objectContaining({
              id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin:entityIdA:mainnet:0xa:1',
              tokenId: 'mainnet:0xa:1'
            }),
            expect.objectContaining({
              id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin:entityIdA:mainnet:0xa:2',
              tokenId: 'mainnet:0xa:2'
            })
          ],
          name: 'nameForentityIdA',
          category: WearableCategory.EARRING,
          entity: expect.anything()
        })
      ])
    })
  })

  test('should fetch all owned third party wearables from different providers', function ({ components }) {
    it('run test', async () => {
      const ownedNfts = ['mainnet:0xa:1', 'mainnet:0xb:3']
      const providerId = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
      const providerId2 = 'urn:decentraland:matic:collections-thirdparty:cryptoavatars'
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(getThirdPartyProviders())
      jest.spyOn(components.alchemyNftFetcher, 'getNFTsForOwner').mockResolvedValue(ownedNfts)
      jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn((url: string) => {
          if (url.includes(providerId)) {
            return Promise.resolve({
              ok: true,
              status: 200,
              headers: new Headers(),
              clone: () => ({}) as Response,
              json: () =>
                Promise.resolve({
                  total: 1,
                  entities: [
                    {
                      id: 'entityIdA',
                      metadata: {
                        id: `${providerId}:entityIdA`,
                        name: 'nameForentityIdA',
                        data: {
                          category: WearableCategory.EARRING
                        },
                        mappings: {
                          mainnet: {
                            '0xa': [
                              {
                                type: 'multiple',
                                ids: ['1', '2']
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                })
            } as Response)
          } else if (url.includes(providerId2)) {
            return Promise.resolve({
              ok: true,
              status: 200,
              headers: new Headers(),
              clone: () => ({}) as Response,
              json: () =>
                Promise.resolve({
                  total: 1,
                  entities: [
                    {
                      id: 'entityIdB',
                      metadata: {
                        id: `${providerId2}:entityIdB`,
                        name: 'nameForentityIdB',
                        data: {
                          category: WearableCategory.EARRING
                        },
                        mappings: {
                          mainnet: {
                            '0xb': [
                              {
                                type: 'single',
                                id: '3'
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                })
            } as Response)
          }
          throw new Error(`Unhandled URL in mock: ${url}`)
        }) as jest.Mock
      )

      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')

      expect(wearables).toEqual([
        expect.objectContaining({
          amount: 1,
          individualData: [
            expect.objectContaining({
              id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin:entityIdA:mainnet:0xa:1',
              tokenId: 'mainnet:0xa:1'
            })
          ],
          name: 'nameForentityIdA',
          category: WearableCategory.EARRING,
          entity: expect.anything()
        }),
        expect.objectContaining({
          amount: 1,
          individualData: [
            expect.objectContaining({
              id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:entityIdB:mainnet:0xb:3',
              tokenId: 'mainnet:0xb:3'
            })
          ],
          name: 'nameForentityIdB',
          category: WearableCategory.EARRING,
          entity: expect.anything()
        })
      ])
    })
  })
})
