import { Rarity } from '@dcl/schemas'
import { ElementsFilters } from '../../../../src/adapters/elements-fetcher'
import { WearableFromQuery, fetchWearables } from '../../../../src/logic/fetch-elements/fetch-items'
import { InvalidRequestError, OnChainWearable } from '../../../../src/types'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'

const logs = {
  getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() })
}

function wearableRow(
  urn: string,
  tokenId: string,
  overrides: { name?: string; rarity?: string; transferredAt?: number } = {}
): WearableFromQuery {
  return {
    urn,
    id: `${urn}-${tokenId}`,
    tokenId,
    transferredAt: overrides.transferredAt ?? 1000,
    itemType: 'wearable_v2',
    category: 'wearable',
    metadata: { wearable: { name: overrides.name ?? urn, category: 'hat' } },
    item: { rarity: overrides.rarity ?? Rarity.COMMON, price: 1 }
  } as WearableFromQuery
}

describe('when fetching owned wearables from the subgraph fallback', () => {
  let theGraph: ReturnType<typeof createTheGraphComponentMock>
  let owner: string
  let result: { elements: OnChainWearable[]; totalAmount: number }

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
    owner = '0xAbCdEf0000000000000000000000000000000001'
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the owner holds several tokens of the same item', () => {
    beforeEach(async () => {
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [wearableRow('urn:a', '1'), wearableRow('urn:a', '2'), wearableRow('urn:a', '3')]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 })
    })

    it('should collapse the tokens into a single item', () => {
      expect(result.elements).toHaveLength(1)
    })

    it('should count the grouped items rather than the underlying rows', () => {
      expect(result.totalAmount).toBe(1)
    })
  })

  describe('and the owner holds more items than fit in one page', () => {
    beforeEach(async () => {
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [wearableRow('urn:a', '1'), wearableRow('urn:b', '1'), wearableRow('urn:c', '1')]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 2, pageNum: 1 })
    })

    it('should return only the requested page', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:a', 'urn:b'])
    })

    it('should report the real total instead of the size of the page', () => {
      expect(result.totalAmount).toBe(3)
    })
  })

  describe('and a page beyond the first is requested', () => {
    beforeEach(async () => {
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [wearableRow('urn:a', '1'), wearableRow('urn:b', '1'), wearableRow('urn:c', '1')]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 2, pageNum: 2 })
    })

    it('should return the items left over after the preceding pages', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:c'])
    })
  })

  describe('and a page before the first is requested', () => {
    beforeEach(async () => {
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [wearableRow('urn:a', '1'), wearableRow('urn:b', '1'), wearableRow('urn:c', '1')]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 2, pageNum: -1 })
    })

    it('should return no items rather than the tail of the list', () => {
      expect(result.elements).toEqual([])
    })

    it('should still report the real total', () => {
      expect(result.totalAmount).toBe(3)
    })
  })

  describe('and the items are filtered by a category the subgraph cannot express', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { category: 'not_a_category' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearableRow('urn:a', '1')] })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should answer empty without querying the subgraph', () => {
      expect(theGraph.maticCollectionsSubgraph.query).not.toHaveBeenCalled()
    })

    it('should report a total of zero', () => {
      expect(result).toEqual({ elements: [], totalAmount: 0 })
    })
  })

  describe('and the items are filtered by rarity', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { rarity: 'rare' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [
          wearableRow('urn:common', '1', { rarity: Rarity.COMMON }),
          wearableRow('urn:rare-a', '1', { rarity: Rarity.RARE }),
          wearableRow('urn:rare-b', '1', { rarity: Rarity.RARE })
        ]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 1, pageNum: 1 }, filters)
    })

    it('should keep only the items of that rarity', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:rare-a'])
    })

    it('should count the total over the filtered items rather than the whole inventory', () => {
      expect(result.totalAmount).toBe(2)
    })
  })

  describe('and the items are filtered by name', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { name: 'HAT' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [
          wearableRow('urn:a', '1', { name: 'Bucket Hat' }),
          wearableRow('urn:b', '1', { name: 'Sneakers' }),
          wearableRow('urn:c', '1', { name: 'hatchling mask' })
        ]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should match the name as a case-insensitive substring', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:a', 'urn:c'])
    })
  })

  describe('and the items are filtered by a rarity no item has', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { rarity: 'not_a_rarity' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearableRow('urn:a', '1')] })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should answer empty instead of rejecting the request', () => {
      expect(result).toEqual({ elements: [], totalAmount: 0 })
    })
  })

  describe('and the items are ordered by name descending', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { orderBy: 'name', direction: 'desc' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [
          wearableRow('urn:a', '1', { name: 'Anvil' }),
          wearableRow('urn:z', '1', { name: 'Zebra' }),
          wearableRow('urn:m', '1', { name: 'Mask' })
        ]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should order the items from Z to A', () => {
      expect(result.elements.map((element) => element.name)).toEqual(['Zebra', 'Mask', 'Anvil'])
    })
  })

  describe('and the items are ordered by rarity, which the subgraph cannot express', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { orderBy: 'rarity', direction: 'desc' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [
          wearableRow('urn:common', '1', { rarity: Rarity.COMMON }),
          wearableRow('urn:unique', '1', { rarity: Rarity.UNIQUE }),
          wearableRow('urn:rare', '1', { rarity: Rarity.RARE })
        ]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should order the items by the rarity scale rather than alphabetically', () => {
      expect(result.elements.map((element) => element.rarity)).toEqual([Rarity.UNIQUE, Rarity.RARE, Rarity.COMMON])
    })
  })

  describe('and the items are ordered by date descending', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { orderBy: 'date', direction: 'desc' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
        nfts: [
          wearableRow('urn:old', '1', { transferredAt: 100 }),
          wearableRow('urn:new', '1', { transferredAt: 900 }),
          wearableRow('urn:mid', '1', { transferredAt: 500 })
        ]
      })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)
    })

    it('should order the items from newest to oldest', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:new', 'urn:mid', 'urn:old'])
    })
  })

  describe('and an unrecognized sort direction is requested', () => {
    let filters: ElementsFilters

    beforeEach(() => {
      filters = { orderBy: 'name', direction: 'sideways' }
      theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [wearableRow('urn:a', '1')] })
    })

    it('should reject it instead of silently falling back to a direction', async () => {
      await expect(fetchWearables({ theGraph, logs }, owner, { pageSize: 10, pageNum: 1 }, filters)).rejects.toThrow(
        InvalidRequestError
      )
    })
  })

  describe('and the owner holds items on both networks', () => {
    let filters: ElementsFilters

    beforeEach(async () => {
      filters = { orderBy: 'name', direction: 'asc' }
      theGraph.ethereumCollectionsSubgraph.query = jest
        .fn()
        .mockResolvedValue({ nfts: [wearableRow('urn:eth', '1', { name: 'Zebra' })] })
      theGraph.maticCollectionsSubgraph.query = jest
        .fn()
        .mockResolvedValue({ nfts: [wearableRow('urn:matic', '1', { name: 'Anvil' })] })
      result = await fetchWearables({ theGraph, logs }, owner, { pageSize: 1, pageNum: 1 }, filters)
    })

    it('should cut the page from both networks merged, not from each one separately', () => {
      expect(result.elements.map((element) => element.urn)).toEqual(['urn:matic'])
    })

    it('should count the items held across both networks', () => {
      expect(result.totalAmount).toBe(2)
    })
  })
})
