import { Entity, WearableCategory } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../src/adapters/definitions'
import { createMarketplaceApiFetcherMock } from '../mocks/marketplace-api-mock'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { SORTED_RARITIES } from '../../src/logic/utils'
import { OnChainWearableResponse } from '../../src/types'
import { testWithComponents } from '../components'
import { generateWearableEntities, generateWearables } from '../data/wearables'

import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
import { generateRandomAddress } from '../helpers'

describe('wearables-handler: GET /users/:address/wearables', () => {
  const testWithComponents_wearables = testWithComponents(() => {
    const wearables = generateWearables(20)
    const marketplaceApiFetcher = createMarketplaceApiFetcherMock({
      wearables,
      shouldFail: false
    })

    return { marketplaceApiFetcher }
  })

  testWithComponents_wearables('wearables-handler tests', function ({ components }) {
    describe('when marketplace API is available and working', () => {
      beforeEach(() => {
        // Reset marketplace API to working state
        components.marketplaceApiFetcher!.fetchUserWearables = jest.fn()
      })

      describe('should return empty when no wearables are found', () => {
        beforeEach(() => {
          // Mock marketplace API with no wearables
          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockResolvedValue({
            wearables: [],
            total: 0
          })
        })

        it('returns empty array when user has no wearables', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [],
            pageNum: 1,
            totalAmount: 0,
            pageSize: 100
          })
        })
      })

      describe('should return wearables from marketplace API', () => {
        beforeEach(() => {
          const testWearables = generateWearables(3)
          // Mock marketplace API with test wearables
          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockResolvedValue({
            wearables: testWearables.map((w) => ({
              urn: w.urn,
              amount: 1,
              individualData: [
                {
                  id: `${w.urn}:${w.tokenId}`,
                  tokenId: w.tokenId,
                  transferredAt: w.transferredAt,
                  price: w.item.price
                }
              ],
              name: w.metadata.wearable.name,
              rarity: w.item.rarity,
              minTransferredAt: w.transferredAt,
              maxTransferredAt: w.transferredAt,
              category: w.metadata.wearable.category
            })),
            total: 3
          })
        })

        it('returns wearables from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(3)
          expect(response.elements).toHaveLength(3)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(100)
        })
      })

      describe('should handle pagination from marketplace API', () => {
        beforeEach(() => {
          const testWearables = generateWearables(5)
          // Mock marketplace API with proper pagination handling
          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockImplementation((_, params) => {
            const limit = params?.limit || 100
            const offset = params?.offset || 0

            const paginatedWearables = testWearables.slice(offset, offset + limit)

            return Promise.resolve({
              wearables: paginatedWearables.map((w) => ({
                urn: w.urn,
                amount: 1,
                individualData: [
                  {
                    id: `${w.urn}:${w.tokenId}`,
                    tokenId: w.tokenId,
                    transferredAt: w.transferredAt,
                    price: w.item.price
                  }
                ],
                name: w.metadata.wearable.name,
                rarity: w.item.rarity,
                minTransferredAt: w.transferredAt,
                maxTransferredAt: w.transferredAt,
                category: w.metadata.wearable.category
              })),
              total: 5
            })
          })
        })

        it('returns paginated results from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?pageSize=2`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(5)
          expect(response.elements).toHaveLength(2)
          expect(response.pageNum).toBe(1)
          expect(response.pageSize).toBe(2)
          // Verify the first two elements are returned in order
          expect(response.elements[0].urn).toBe('urn-0')
          expect(response.elements[1].urn).toBe('urn-1')
        })
      })

      describe('should handle filters from marketplace API', () => {
        beforeEach(() => {
          // Mock for name filter test
          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockImplementation((_, params) => {
            if (params?.name === '3') {
              return Promise.resolve({
                wearables: [
                  {
                    urn: 'urn:decentraland:matic:collections:0x123:3',
                    amount: 1,
                    individualData: [
                      {
                        id: 'urn:decentraland:matic:collections:0x123:3:1',
                        tokenId: '1',
                        transferredAt: Date.now(),
                        price: '100'
                      }
                    ],
                    name: 'wearable 3',
                    rarity: 'uncommon',
                    minTransferredAt: Date.now(),
                    maxTransferredAt: Date.now(),
                    category: 'upper_body'
                  }
                ],
                total: 1
              })
            }
            if (params?.category === 'upper_body') {
              return Promise.resolve({
                wearables: [
                  {
                    urn: 'urn:decentraland:matic:collections:0x456:1',
                    amount: 1,
                    individualData: [
                      {
                        id: 'urn:decentraland:matic:collections:0x456:1:1',
                        tokenId: '1',
                        transferredAt: Date.now(),
                        price: '150'
                      }
                    ],
                    name: 'Cool Shirt',
                    rarity: 'rare',
                    minTransferredAt: Date.now(),
                    maxTransferredAt: Date.now(),
                    category: 'upper_body'
                  }
                ],
                total: 1
              })
            }
            return Promise.resolve({ wearables: [], total: 0 })
          })
        })

        it('returns filtered results by name from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?name=3`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(1)
          expect(response.elements).toHaveLength(1)
          expect(response.elements[0].name).toBe('wearable 3')
        })

        it('returns filtered results by category from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?category=upper_body`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(1)
          expect(response.elements).toHaveLength(1)
          expect(response.elements[0].category).toBe('upper_body')
        })
      })

      describe('should handle sorting from marketplace API', () => {
        beforeEach(() => {
          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockResolvedValue({
            wearables: [
              {
                urn: 'urn:decentraland:matic:collections:0x789:2',
                amount: 1,
                individualData: [
                  {
                    id: 'urn:decentraland:matic:collections:0x789:2:1',
                    tokenId: '1',
                    transferredAt: Date.now(),
                    price: '200'
                  }
                ],
                name: 'Zebra Hat',
                rarity: 'epic',
                minTransferredAt: Date.now(),
                maxTransferredAt: Date.now(),
                category: 'hat'
              },
              {
                urn: 'urn:decentraland:matic:collections:0x789:1',
                amount: 1,
                individualData: [
                  {
                    id: 'urn:decentraland:matic:collections:0x789:1:1',
                    tokenId: '1',
                    transferredAt: Date.now(),
                    price: '100'
                  }
                ],
                name: 'Alpha Helmet',
                rarity: 'common',
                minTransferredAt: Date.now(),
                maxTransferredAt: Date.now(),
                category: 'helmet'
              }
            ],
            total: 2
          })
        })

        it('returns filtered and sorted results from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?orderBy=name&direction=DESC`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(2)
          expect(response.elements).toHaveLength(2)
          expect(response.elements[0].name).toBe('Zebra Hat')
          expect(response.elements[1].name).toBe('Alpha Helmet')
        })
      })

      describe('should handle definitions and entities from marketplace API', () => {
        beforeEach(() => {
          const testWearables = generateWearables(2)
          const entities = generateWearableEntities(testWearables.map((w) => w.urn))

          // Mock content fetcher
          components.content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

          components.marketplaceApiFetcher!.fetchUserWearables = jest.fn().mockResolvedValue({
            wearables: testWearables.map((w) => ({
              urn: w.urn,
              amount: 1,
              individualData: [
                {
                  id: `${w.urn}:${w.tokenId}`,
                  tokenId: w.tokenId,
                  transferredAt: w.transferredAt,
                  price: w.item.price
                }
              ],
              name: w.metadata.wearable.name,
              rarity: w.item.rarity,
              minTransferredAt: w.transferredAt,
              maxTransferredAt: w.transferredAt,
              category: w.metadata.wearable.category
            })),
            total: 2
          })
        })

        it('returns wearables with definitions from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(2)
          expect(response.elements).toHaveLength(2)
          expect(response.elements[0]).toHaveProperty('definition')
        })

        it('returns wearables with entities from marketplace API', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeEntities`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(2)
          expect(response.elements).toHaveLength(2)
          expect(response.elements[0]).toHaveProperty('entity')
        })
      })
    })

    describe('when marketplace API fails and falls back to The Graph', () => {
      beforeEach(() => {
        // Make marketplace API fail to trigger TheGraph fallback
        components.marketplaceApiFetcher!.fetchUserWearables = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))
      })

      describe('should fallback to The Graph when marketplace API fails', () => {
        beforeEach(() => {
          // Reset TheGraph mocks for each test
          components.theGraph.ethereumCollectionsSubgraph.query = jest.fn()
          components.theGraph.maticCollectionsSubgraph.query = jest.fn()
        })

        it('returns empty when no wearables are found in The Graph', async () => {
          const { localFetch, theGraph } = components

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [],
            pageNum: 1,
            totalAmount: 0,
            pageSize: 100
          })
        })

        it('returns wearables from The Graph after marketplace API fails', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(2)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearables[0]] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearables[1]] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(2)
          expect(response.elements).toHaveLength(2)
        })

        it('handles pagination correctly with The Graph fallback', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(7)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: wearables.slice(0, 2) })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: wearables.slice(2, 3) })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?limit=3`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(3)
          expect(response.elements).toHaveLength(3)
        })

        it('handles filters correctly with The Graph fallback', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(17)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: wearables })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?name=3`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(17)
          expect(response.elements).toHaveLength(17)
        })

        it('handles definitions correctly with The Graph fallback', async () => {
          const { localFetch, theGraph, content } = components

          // Generate unique URNs to avoid cache hits
          const uniqueId = Date.now()
          const testWearables = generateWearables(2).map((w, i) => ({
            ...w,
            urn: `urn-definitions-test-${uniqueId}-${i}`
          }))
          const entities = generateWearableEntities(testWearables.map((w) => w.urn))

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [testWearables[0]] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [testWearables[1]] })
          content.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables?includeDefinitions`)

          expect(r.status).toBe(200)
          const response = await r.json()
          expect(response.totalAmount).toBe(2)
          expect(response.elements).toHaveLength(2)
          expect(response.elements[0]).toHaveProperty('definition')
          expect(content.fetchEntitiesByPointers).toHaveBeenCalledWith([
            `urn-definitions-test-${uniqueId}-0`,
            `urn-definitions-test-${uniqueId}-1`
          ])
        })
      })
    })

    describe('when marketplace API is not available (original The Graph behavior)', () => {
      beforeEach(() => {
        // Make marketplace API fail to use only TheGraph
        components.marketplaceApiFetcher!.fetchUserWearables = jest
          .fn()
          .mockRejectedValue(new Error('Marketplace API failure'))

        // Reset TheGraph mocks
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn()
        components.theGraph.maticCollectionsSubgraph.query = jest.fn()
      })

      describe('should use The Graph directly when marketplace API is not available', () => {
        it('returns empty when no wearables are found in The Graph', async () => {
          const { localFetch, theGraph } = components

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [],
            pageNum: 1,
            totalAmount: 0,
            pageSize: 100
          })
        })

        it('returns wearables from ethereum collection', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(1)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: wearables })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [...convertToDataModel(wearables)].sort(rarest),
            pageNum: 1,
            pageSize: 100,
            totalAmount: 1
          })
        })

        it('returns wearables from matic collection', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(1)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: wearables })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [...convertToDataModel(wearables)].sort(rarest),
            pageNum: 1,
            pageSize: 100,
            totalAmount: 1
          })
        })

        it('returns wearables from both collections', async () => {
          const { localFetch, theGraph } = components
          const wearables = generateWearables(2)

          theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearables[0]] })
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearables[1]] })

          const r = await localFetch.fetch(`/users/${generateRandomAddress()}/wearables`)

          expect(r.status).toBe(200)
          expect(await r.json()).toEqual({
            elements: [...convertToDataModel(wearables)].sort(rarest),
            pageNum: 1,
            pageSize: 100,
            totalAmount: 2
          })
        })
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        // Reset mocks for error handling tests
        components.marketplaceApiFetcher!.fetchUserWearables = jest.fn()
        components.theGraph.ethereumCollectionsSubgraph.query = jest.fn()
        components.theGraph.maticCollectionsSubgraph.query = jest.fn()
      })

      describe('should handle errors correctly', () => {
        it('returns error when both marketplace API and The Graph fail', async () => {
          const { localFetch, theGraph } = components

          // Mock marketplace API to fail
          components.marketplaceApiFetcher!.fetchUserWearables = jest
            .fn()
            .mockRejectedValue(new Error('Marketplace API failure'))

          // Mock The Graph to fail
          theGraph.ethereumCollectionsSubgraph.query = jest
            .fn()
            .mockRejectedValue(new Error('GraphQL Error: Invalid response. Errors:\n- some error. Provider: ethereum'))
          theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

          const wallet = generateRandomAddress()
          const r = await localFetch.fetch(`/users/${wallet}/wearables`)

          expect(r.status).toBe(502)
          expect(await r.json()).toEqual({
            error: 'The requested items cannot be fetched right now',
            message: `Cannot fetch elements for ${wallet}`
          })
        })

        it('returns error when includeDefinitions and includeEntities are used together', async () => {
          const { localFetch } = components

          const r = await localFetch.fetch(
            `/users/${generateRandomAddress()}/wearables?includeDefinitions&includeEntities`
          )

          expect(r.status).toBe(400)
          expect(await r.json()).toEqual({
            error: 'Bad request',
            message: 'Cannot use includeEntities and includeDefinitions together'
          })
        })
      })
    })
  })
})

type ContentInfo = {
  entities: Entity[]
  contentServerUrl: string
  includeEntity?: boolean
  includeDefinition?: boolean
}

function convertToDataModel(wearables: WearableFromQuery[], contentInfo?: ContentInfo): OnChainWearableResponse[] {
  return wearables.map((wearable) => {
    const individualData = {
      id: `${wearable.urn}:${wearable.tokenId}`,
      tokenId: wearable.tokenId,
      price: wearable.item.price.toString(),
      transferredAt: wearable.transferredAt.toString()
    }
    const rarity = wearable.item.rarity
    const entity = contentInfo?.entities.find((def) => def.id === wearable.urn)
    const contentServerUrl = contentInfo?.contentServerUrl
    return {
      urn: wearable.urn,
      amount: 1,
      individualData: [individualData],
      rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      definition:
        contentInfo?.includeDefinition && entity
          ? extractWearableDefinitionFromEntity({ contentServerUrl }, entity)
          : undefined,
      entity: contentInfo?.includeEntity && entity ? entity : undefined
    }
  })
}
