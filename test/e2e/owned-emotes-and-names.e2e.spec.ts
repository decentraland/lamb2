import { get, LAMBDAS_URL, OwnedItem, Page, wallet } from './realm'

type Name = { name: string; contractAddress: string; tokenId: string }

describe('when listing the emotes a wallet owns', () => {
  let page: Awaited<ReturnType<typeof get<Page<OwnedItem>>>>

  beforeEach(async () => {
    const { address } = await wallet()
    page = await get<Page<OwnedItem>>(`${LAMBDAS_URL}/users/${address}/emotes?pageSize=5&pageNum=1`)
  })

  it('should answer a page with the pagination fields', () => {
    expect(page.body).toMatchObject({ pageNum: 1, pageSize: 5, totalAmount: expect.any(Number) })
  })

  it('should describe every emote with its identity, metadata and tokens', () => {
    expect(
      page.body.elements.every(
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

describe('when listing the names a wallet owns', () => {
  let page: Awaited<ReturnType<typeof get<Page<Name>>>>

  beforeEach(async () => {
    const { address } = await wallet()
    page = await get<Page<Name>>(`${LAMBDAS_URL}/users/${address}/names?pageSize=5&pageNum=1`)
  })

  it('should answer a page with the pagination fields', () => {
    expect(page.body).toMatchObject({ pageNum: 1, pageSize: 5, totalAmount: expect.any(Number) })
  })

  it('should describe every name with the contract and token that back it', () => {
    expect(page.body.elements.every((element) => element.name && element.contractAddress && element.tokenId)).toBe(true)
  })
})
