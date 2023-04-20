import { leastRare, rarest } from '../../../src/logic/sorting'
import { WearableCategory } from '@dcl/schemas'
import { Item } from '../../../src/types'

describe('sorting', function () {
  const transferredAt = Date.now()
  const item1: Item = {
    urn: 'urn-1',
    amount: 1,
    individualData: [
      {
        id: 'id-1',
        tokenId: 'tokenId-1',
        price: 100,
        transferredAt: transferredAt
      }
    ],
    name: 'name-1',
    category: WearableCategory.EARRING,
    rarity: 'unique',
    minTransferredAt: Date.now(),
    maxTransferredAt: Date.now()
  }

  const item2: Item = {
    urn: 'urn-2',
    amount: 1,
    individualData: [
      {
        id: 'id-2',
        tokenId: 'tokenId-2',
        price: 100,
        transferredAt: transferredAt - 1
      }
    ],
    name: 'name-1',
    category: WearableCategory.EARRING,
    rarity: 'common',
    minTransferredAt: Date.now(),
    maxTransferredAt: Date.now()
  }

  test('by rarest', function () {
    // item1 is rarer than item2
    expect(rarest(item1, item2)).toBeLessThanOrEqual(-1)
    expect(rarest(item1, item1)).toBe(0)
    expect(rarest(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(rarest(item2, item2)).toBe(0)
    expect([item1, item2].sort(rarest)).toEqual([item1, item2])
  })

  test('by least rare', function () {
    // item2 is less rare than item1
    expect(leastRare(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(leastRare(item1, item1)).toBe(0)
    expect(leastRare(item2, item1)).toBeLessThanOrEqual(-1)
    expect(leastRare(item2, item2)).toBe(0)

    expect([item1, item2].sort(leastRare)).toEqual([item2, item1])
  })
})
