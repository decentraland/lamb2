import { get, LAMBDAS_URL, OwnedItem, Page, wallet } from './realm'

type PageResponse = Awaited<ReturnType<typeof get<Page<OwnedItem>>>>

function pageOf(address: string, query: string): Promise<PageResponse> {
  return get<Page<OwnedItem>>(`${LAMBDAS_URL}/users/${address}/wearables?${query}`)
}

const names = (page: PageResponse): string[] => page.body.elements.map((element) => element.name)
const urns = (page: PageResponse): string[] => page.body.elements.map((element) => element.urn)
const earliestTransfer = (element: OwnedItem): number =>
  Math.min(...element.individualData.map((data) => Number(data.transferredAt)))

describe('when listing the wearables a wallet owns', () => {
  let address: string
  let firstPage: PageResponse

  beforeEach(async () => {
    ;({ address } = await wallet())
    firstPage = await pageOf(address, 'pageSize=5&pageNum=1')
  })

  describe('and the first page is requested', () => {
    it('should answer a page of at most the requested size', () => {
      expect(firstPage.body.elements.length).toBeLessThanOrEqual(5)
    })

    it('should echo the page requested and report a total covering at least the page', () => {
      expect(firstPage.body).toMatchObject({ pageNum: 1, pageSize: 5, totalAmount: expect.any(Number) })
    })

    it('should describe every item with its identity, metadata and tokens', () => {
      expect(
        firstPage.body.elements.every(
          (element) =>
            element.urn &&
            element.name !== undefined &&
            element.category &&
            element.rarity &&
            element.individualData.length > 0
        )
      ).toBe(true)
    })
  })

  describe('and two consecutive pages are requested', () => {
    let secondPage: PageResponse

    beforeEach(async () => {
      secondPage = await pageOf(address, 'pageSize=5&pageNum=2')
    })

    it('should not repeat an item across the pages', () => {
      expect(urns(secondPage).filter((urn) => urns(firstPage).includes(urn))).toEqual([])
    })

    it('should report the same total on both pages', () => {
      expect(secondPage.body.totalAmount).toBe(firstPage.body.totalAmount)
    })
  })

  describe('and every item is requested in a single page', () => {
    let all: PageResponse

    beforeEach(async () => {
      all = await pageOf(address, 'pageSize=1000&pageNum=1')
    })

    it('should return exactly as many items as the total it reports', () => {
      expect(all.body.elements).toHaveLength(all.body.totalAmount)
    })
  })

  describe('and the list is ordered by name in both directions', () => {
    let ascending: PageResponse
    let descending: PageResponse

    beforeEach(async () => {
      ascending = await pageOf(address, 'pageSize=1000&orderBy=name&direction=ASC')
      descending = await pageOf(address, 'pageSize=1000&orderBy=name&direction=DESC')
    })

    it('should list the same names in opposite order', () => {
      expect(names(descending)).toEqual([...names(ascending)].reverse())
    })
  })

  describe('and the list is ordered by date, oldest first', () => {
    let ordered: PageResponse

    beforeEach(async () => {
      ordered = await pageOf(address, 'pageSize=1000&orderBy=date&direction=ASC')
    })

    it('should never place a later acquisition before an earlier one', () => {
      const earliest = ordered.body.elements.map(earliestTransfer)
      expect(earliest.every((value, index) => index === 0 || value >= earliest[index - 1])).toBe(true)
    })
  })

  describe('and the list is filtered by a rarity the wallet holds', () => {
    let rarity: string
    let filtered: PageResponse
    let upperCased: PageResponse

    beforeEach(async () => {
      rarity = firstPage.body.elements[0].rarity
      filtered = await pageOf(address, `pageSize=1000&rarity=${rarity}`)
      upperCased = await pageOf(address, `pageSize=1000&rarity=${rarity.toUpperCase()}`)
    })

    it('should return only items of that rarity', () => {
      expect(filtered.body.elements.every((element) => element.rarity === rarity)).toBe(true)
    })

    it('should treat the rarity case-insensitively', () => {
      expect(upperCased.body.totalAmount).toBe(filtered.body.totalAmount)
    })
  })

  describe('and the list is filtered by a category the wallet holds', () => {
    let category: string
    let filtered: PageResponse
    let upperCased: PageResponse

    beforeEach(async () => {
      category = firstPage.body.elements[0].category
      filtered = await pageOf(address, `pageSize=1000&category=${category}`)
      upperCased = await pageOf(address, `pageSize=1000&category=${category.toUpperCase()}`)
    })

    it('should return only items of that category', () => {
      expect(filtered.body.elements.every((element) => element.category === category)).toBe(true)
    })

    it('should treat the category case-insensitively', () => {
      expect(upperCased.body.totalAmount).toBe(filtered.body.totalAmount)
    })
  })

  describe('and the list is filtered by a category no item has', () => {
    let filtered: PageResponse

    beforeEach(async () => {
      filtered = await pageOf(address, 'pageSize=5&category=not_a_category')
    })

    it('should answer an empty page rather than an error', () => {
      expect([filtered.status, filtered.body.elements, filtered.body.totalAmount]).toEqual([200, [], 0])
    })
  })

  describe('and the list is filtered by part of an item name', () => {
    let fragment: string
    let filtered: PageResponse

    beforeEach(async () => {
      fragment = firstPage.body.elements[0].name.trim().split(' ')[0].slice(0, 3).toLowerCase()
      filtered = await pageOf(address, `pageSize=1000&name=${encodeURIComponent(fragment)}`)
    })

    it('should return only items whose name contains the fragment, regardless of case', () => {
      expect(filtered.body.elements.every((element) => element.name.toLowerCase().includes(fragment))).toBe(true)
    })

    it('should report a total no larger than the unfiltered one', () => {
      expect(filtered.body.totalAmount).toBeLessThanOrEqual(firstPage.body.totalAmount)
    })
  })

  describe('and a page size above the maximum is requested', () => {
    let response: PageResponse

    beforeEach(async () => {
      response = await pageOf(address, 'pageSize=5000')
    })

    it('should reject the request', () => {
      expect(response.status).toBe(400)
    })
  })

  describe('and a page before the first is requested', () => {
    let response: PageResponse

    beforeEach(async () => {
      response = await pageOf(address, 'pageSize=5&pageNum=0')
    })

    it('should answer an empty page rather than an error', () => {
      expect([response.status, response.body?.elements]).toEqual([200, []])
    })
  })

  describe('and the same page is requested twice in a row', () => {
    let again: PageResponse

    beforeEach(async () => {
      again = await pageOf(address, 'pageSize=5&pageNum=1')
    })

    it('should answer identically', () => {
      expect(again.body).toEqual(firstPage.body)
    })
  })
})
