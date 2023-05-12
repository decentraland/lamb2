import { WearableCategory } from '@dcl/schemas'
import {
  leastRare,
  leastRareOptional,
  nameAZ,
  nameZA,
  newest,
  newestOptional,
  oldest,
  oldestOptional,
  rarest,
  rarestOptional
} from '../../../src/logic/sorting'
import { BaseWearable, OnChainWearable } from '../../../src/types'

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

  const baseItem1: Omit<BaseWearable, 'entity'> = {
    urn: 'urn-4',
    amount: 1,
    individualData: [
      {
        id: 'id-4'
      }
    ],
    name: 'Blue Star Earring',
    category: WearableCategory.EARRING
  }

  const baseItem2: Omit<BaseWearable, 'entity'> = {
    urn: 'urn-5',
    amount: 1,
    individualData: [
      {
        id: 'id-5'
      }
    ],
    name: 'Green Star Earring',
    category: WearableCategory.EARRING
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
    expect(leastRare(item2, item3)).toBeLessThanOrEqual(1)

    expect([item1, item2, item3].sort(leastRare)).toEqual([item3, item2, item1])
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
    expect(nameZA(item2, item3)).toBeLessThanOrEqual(1)

    expect([item1, item2, item3].sort(nameZA)).toEqual([item1, item3, item2])
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
    expect(oldest(item2, item3)).toBeLessThanOrEqual(1)

    expect([item1, item2, item3].sort(oldest)).toEqual([item3, item2, item1])
  })

  test('by rarestOptional', function () {
    // item1 is rarer than item2
    expect(rarestOptional(item1, item2)).toBeLessThanOrEqual(-1)
    expect(rarestOptional(item1, item1)).toBe(0)
    expect(rarestOptional(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(rarestOptional(item2, item2)).toBe(0)

    // item2 is just as rare as item3, so it is disambiguated by urn
    expect(rarestOptional(item2, item3)).toBeLessThanOrEqual(-1)

    // When one of the items has no rarity (or both)
    expect(rarestOptional(item2, baseItem1)).toBeLessThanOrEqual(-1)
    expect(rarestOptional(baseItem1, item2)).toBeGreaterThanOrEqual(1)
    expect(rarestOptional(baseItem1, baseItem2)).toBeLessThanOrEqual(-1)
    expect([baseItem2, baseItem1].sort(rarestOptional)).toEqual([baseItem1, baseItem2])

    expect([item1, item2, item3, baseItem1, baseItem2].sort(rarestOptional)).toEqual([
      item1,
      item2,
      item3,
      baseItem1,
      baseItem2
    ])
  })

  test('by leastRareOptional', function () {
    // item2 is less rare than item1
    expect(leastRareOptional(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(leastRareOptional(item1, item1)).toBe(0)
    expect(leastRareOptional(item2, item1)).toBeLessThanOrEqual(-1)
    expect(leastRareOptional(item2, item2)).toBe(0)

    // item2 is just as rare as item3, so it is disambiguated by urn
    expect(leastRareOptional(item2, item3)).toBeGreaterThanOrEqual(1)

    // When one of the items has no rarity (or both)
    expect(leastRareOptional(item2, baseItem1)).toBeGreaterThanOrEqual(1)
    expect(leastRareOptional(baseItem1, item2)).toBeLessThanOrEqual(-1)
    expect(leastRareOptional(baseItem1, baseItem2)).toBeGreaterThanOrEqual(1)
    expect([baseItem2, baseItem1].sort(leastRareOptional)).toEqual([baseItem2, baseItem1])

    expect([item1, item2, item3, baseItem1, baseItem2].sort(leastRareOptional)).toEqual([
      baseItem2,
      baseItem1,
      item3,
      item2,
      item1
    ])
  })

  test('by newestOptional', function () {
    // item1 is newer than item2
    expect(newestOptional(item1, item2)).toBeLessThanOrEqual(-1)
    expect(newestOptional(item1, item1)).toBe(0)
    expect(newestOptional(item2, item1)).toBeGreaterThanOrEqual(1)
    expect(newestOptional(item2, item2)).toBe(0)

    // item2 is as old as item3, so it is disambiguated by urn
    expect(newestOptional(item2, item3)).toBeLessThanOrEqual(-1)

    // When one of the items has no date (or both)
    expect(newestOptional(item2, baseItem1)).toBeLessThanOrEqual(-1)
    expect(newestOptional(baseItem1, item2)).toBeGreaterThanOrEqual(1)
    expect(newestOptional(baseItem1, baseItem2)).toBeLessThanOrEqual(-1)
    expect([baseItem2, baseItem1].sort(newestOptional)).toEqual([baseItem1, baseItem2])

    expect([item1, item2, item3, baseItem1, baseItem2].sort(newestOptional)).toEqual([
      item1,
      item2,
      item3,
      baseItem1,
      baseItem2
    ])
  })

  test('by oldestOptional', function () {
    // item2 is older than item1
    expect(oldestOptional(item1, item2)).toBeGreaterThanOrEqual(1)
    expect(oldestOptional(item1, item1)).toBe(0)
    expect(oldestOptional(item2, item1)).toBeLessThanOrEqual(-1)
    expect(oldestOptional(item2, item2)).toBe(0)

    // item2 is as old as item3, so it is disambiguated by urn
    expect(oldestOptional(item2, item3)).toBeLessThanOrEqual(1)

    // When one of the items has no date (or both)
    expect(oldestOptional(item2, baseItem1)).toBeGreaterThanOrEqual(1)
    expect(oldestOptional(baseItem1, item2)).toBeLessThanOrEqual(-1)
    expect(oldestOptional(baseItem1, baseItem2)).toBeLessThanOrEqual(-1)
    expect([baseItem2, baseItem1].sort(oldestOptional)).toEqual([baseItem1, baseItem2])

    expect([item1, item2, item3, baseItem1, baseItem2].sort(oldestOptional)).toEqual([
      baseItem1,
      baseItem2,
      item3,
      item2,
      item1
    ])
  })
})
