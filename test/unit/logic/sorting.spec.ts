import { WearableCategory } from '@dcl/schemas'
import { leastRare, nameAZ, nameZA, newest, oldest, rarest } from '../../../src/logic/sorting'
import { OnChainWearable } from '../../../src/types'

describe('sorting', function () {
  const transferredAt = Date.now()
  const item1: OnChainWearable = {
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
    name: 'Diamond earrings',
    category: WearableCategory.EARRING,
    rarity: 'unique',
    minTransferredAt: transferredAt,
    maxTransferredAt: transferredAt
  }

  const item2: OnChainWearable = {
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
    name: 'Covid Mask',
    category: WearableCategory.EYEWEAR,
    rarity: 'common',
    minTransferredAt: transferredAt - 1,
    maxTransferredAt: transferredAt - 1
  }

  const item3: OnChainWearable = {
    urn: 'urn-3',
    amount: 1,
    individualData: [
      {
        id: 'id-3',
        tokenId: 'tokenId-3',
        price: 100,
        transferredAt: transferredAt - 1
      }
    ],
    name: 'Covid Mask',
    category: WearableCategory.EYEWEAR,
    rarity: 'common',
    minTransferredAt: transferredAt - 1,
    maxTransferredAt: transferredAt - 1
  }

  test('by rarest', function () {
    // item1 is rarer than item2
    expect(rarest(item1, item2)).toBeLessThanOrEqual(-1)
    expect(rarest(item1, item1)).toBe(0)
    expect(rarest(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(rarest(item2, item2)).toBe(0)

    // item2 is just as rare as item3, so it is disambiguated by urn
    expect(rarest(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(rarest)).toEqual([item1, item2, item3])
  })

  test('by leastRare', function () {
    // item2 is less rare than item1
    expect(leastRare(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(leastRare(item1, item1)).toBe(0)
    expect(leastRare(item2, item1)).toBeLessThanOrEqual(-1)
    expect(leastRare(item2, item2)).toBe(0)

    // item2 is just as rare as item3, so it is disambiguated by urn
    expect(leastRare(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(leastRare)).toEqual([item2, item3, item1])
  })

  test('by nameAZ', function () {
    // item1 name is after than item2
    expect(nameAZ(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(nameAZ(item1, item1)).toBe(0)
    expect(nameAZ(item2, item1)).toBeLessThanOrEqual(-1)
    expect(nameAZ(item2, item2)).toBe(0)

    // item2 has same name as item3, so it is disambiguated by urn
    expect(nameAZ(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(nameAZ)).toEqual([item2, item3, item1])
  })

  test('by nameZA', function () {
    // item1 name is before than item2
    expect(nameZA(item1, item2)).toBeLessThanOrEqual(-1)
    expect(nameZA(item1, item1)).toBe(0)
    expect(nameZA(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(nameZA(item2, item2)).toBe(0)

    // item2 has same name as item3, so it is disambiguated by urn
    expect(nameZA(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(nameZA)).toEqual([item1, item2, item3])
  })

  test('by newest', function () {
    // item1 is newer than item2
    expect(newest(item1, item2)).toBeLessThanOrEqual(-1)
    expect(newest(item1, item1)).toBe(0)
    expect(newest(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(newest(item2, item2)).toBe(0)

    // item2 is as old as item3, so it is disambiguated by urn
    expect(newest(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(newest)).toEqual([item1, item2, item3])
  })

  test('by oldest', function () {
    // item2 is older than item1
    expect(oldest(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(oldest(item1, item1)).toBe(0)
    expect(oldest(item2, item1)).toBeLessThanOrEqual(-1)
    expect(oldest(item2, item2)).toBe(0)

    // item2 is as old as item3, so it is disambiguated by urn
    expect(oldest(item2, item3)).toBeLessThanOrEqual(-1)

    expect([item1, item2, item3].sort(oldest)).toEqual([item2, item3, item1])
  })
})
