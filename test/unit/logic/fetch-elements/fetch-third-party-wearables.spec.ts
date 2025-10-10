import { test } from '../../../components'
import {
  fetchAllThirdPartyWearables,
  fetchThirdPartyWearablesFromThirdPartyName
} from '../../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { getThirdPartyProviders } from '../../../data/wearables'
import { WearableCategory } from '@dcl/schemas'
import { FetcherError } from '../../../../src/adapters/elements-fetcher'

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

  test('should return empty array when no providers are found', function ({ components }) {
    beforeEach(() => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([])
    })

    it('run test', async () => {
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')

      expect(wearables).toEqual([])
    })
  })

  test('should return empty array when no NFTs are owned', function ({ components }) {
    beforeEach(() => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(getThirdPartyProviders())
      jest.spyOn(components.alchemyNftFetcher, 'getNFTsForOwner').mockResolvedValue([])
    })

    it('run test', async () => {
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')

      expect(wearables).toEqual([])
    })
  })

  test('should handle providers without contracts', function ({ components }) {
    let providersWithoutContracts: any[]

    beforeEach(() => {
      providersWithoutContracts = [
        {
          id: 'urn:decentraland:matic:collections-thirdparty:test',
          resolver: 'resolver',
          metadata: {
            thirdParty: {
              name: 'Test Provider',
              description: 'Test'
            }
          }
        }
      ]
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(providersWithoutContracts)
    })

    it('run test', async () => {
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')

      expect(wearables).toEqual([])
    })
  })

  test('should handle duplicate wearables by URN', function ({ components }) {
    it('run test', async () => {
      const ownedNfts = ['mainnet:0xa:1', 'mainnet:0xa:2']
      const providerId = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(getThirdPartyProviders())
      jest.spyOn(components.alchemyNftFetcher, 'getNFTsForOwner').mockResolvedValue(ownedNfts)

      // Mock fetch to return the same entity twice to test deduplication
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

      // Should only have one wearable despite potential duplicates
      expect(wearables).toHaveLength(1)
      expect(wearables[0].urn).toBe(`${providerId}:entityIdA`)
    })
  })

  test('should handle providers with no matching contracts', function ({ components }) {
    let providers: any[]
    let noMatchingNfts: string[]

    beforeEach(() => {
      providers = getThirdPartyProviders()
      noMatchingNfts = ['ethereum:0xwrong:1'] // NFT that doesn't match provider contracts
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(providers)
      jest.spyOn(components.alchemyNftFetcher, 'getNFTsForOwner').mockResolvedValue(noMatchingNfts)
    })

    it('run test', async () => {
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')

      expect(wearables).toEqual([])
    })
  })
})

describe('fetchThirdPartyWearablesFromThirdPartyName', () => {
  test('should fetch third party wearables from specific third party name', function ({ components }) {
    let thirdPartyName: any
    let mockWearables: any[]

    beforeEach(() => {
      thirdPartyName = { thirdPartyName: 'test-provider' } as any
      mockWearables = [
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:test-provider:collection-id:item-id',
          name: 'Test Item',
          category: WearableCategory.HAT,
          individualData: [],
          amount: 1,
          entity: {} as any
        }
      ]
      jest.spyOn(components.thirdPartyWearablesFetcher, 'fetchOwnedElements').mockResolvedValue({
        elements: mockWearables,
        totalAmount: mockWearables.length
      })
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue({
        id: 'test-provider',
        resolver: 'resolver',
        metadata: { thirdParty: { name: 'Test', description: 'Test' } }
      })
    })

    it('run test', async () => {
      const result = await fetchThirdPartyWearablesFromThirdPartyName(components, 'address', thirdPartyName)

      expect(result).toEqual(mockWearables)
    })
  })

  test('should throw FetcherError when third party provider not found', function ({ components }) {
    let thirdPartyName: any

    beforeEach(() => {
      thirdPartyName = { thirdPartyName: 'nonexistent-provider' } as any
      jest.spyOn(components.thirdPartyWearablesFetcher, 'fetchOwnedElements').mockResolvedValue({
        elements: [],
        totalAmount: 0
      })
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue(null)
    })

    it('run test', async () => {
      await expect(fetchThirdPartyWearablesFromThirdPartyName(components, 'address', thirdPartyName)).rejects.toThrow(
        FetcherError
      )
      await expect(fetchThirdPartyWearablesFromThirdPartyName(components, 'address', thirdPartyName)).rejects.toThrow(
        'Third Party not found: nonexistent-provider'
      )
    })
  })

  test('should filter wearables by matching third party name', function ({ components }) {
    let thirdPartyName: any
    let mockWearables: any[]

    beforeEach(() => {
      thirdPartyName = { thirdPartyName: 'correct-provider' } as any
      mockWearables = [
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:correct-provider:collection-id:item1',
          name: 'Correct Item',
          category: WearableCategory.HAT,
          individualData: [],
          amount: 1,
          entity: {} as any
        },
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:wrong-provider:collection-id:item2',
          name: 'Wrong Item',
          category: WearableCategory.HAT,
          individualData: [],
          amount: 1,
          entity: {} as any
        }
      ]
      jest.spyOn(components.thirdPartyWearablesFetcher, 'fetchOwnedElements').mockResolvedValue({
        elements: mockWearables,
        totalAmount: mockWearables.length
      })
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue({
        id: 'correct-provider',
        resolver: 'resolver',
        metadata: { thirdParty: { name: 'Test', description: 'Test' } }
      })
    })

    it('run test', async () => {
      const result = await fetchThirdPartyWearablesFromThirdPartyName(components, 'address', thirdPartyName)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Correct Item')
    })
  })

  test('should handle empty wearables response', function ({ components }) {
    let thirdPartyName: any

    beforeEach(() => {
      thirdPartyName = { thirdPartyName: 'test-provider' } as any
      jest.spyOn(components.thirdPartyWearablesFetcher, 'fetchOwnedElements').mockResolvedValue({
        elements: null as any,
        totalAmount: 0
      })
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue({
        id: 'test-provider',
        resolver: 'resolver',
        metadata: { thirdParty: { name: 'Test', description: 'Test' } }
      })
    })

    it('run test', async () => {
      const result = await fetchThirdPartyWearablesFromThirdPartyName(components, 'address', thirdPartyName)

      expect(result).toEqual([])
    })
  })
})
