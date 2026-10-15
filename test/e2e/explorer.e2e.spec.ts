import { EXPLORER_URL, get, Page, wallet } from './realm'

type ExplorerItem = { urn: string; type: string; entity: { id: string; metadata: unknown } }

describe('when the explorer backpack asks for on-chain wearables', () => {
  let page: Awaited<ReturnType<typeof get<Page<ExplorerItem>>>>

  beforeEach(async () => {
    const { address } = await wallet()
    page = await get<Page<ExplorerItem>>(
      `${EXPLORER_URL}/${address}/wearables?pageSize=3&pageNum=1&collectionType=on-chain`
    )
  })

  it('should be served from the realm root', () => {
    expect(page.status).toBe(200)
  })

  it('should answer a page with the pagination fields', () => {
    expect(page.body).toMatchObject({ pageNum: 1, pageSize: 3, totalAmount: expect.any(Number) })
  })

  it('should attach the content entity to every item so the client can render it', () => {
    expect(page.body.elements.every((element) => element.type === 'on-chain' && element.entity?.id)).toBe(true)
  })
})

describe('when the explorer backpack asks for emotes', () => {
  let page: Awaited<ReturnType<typeof get<Page<ExplorerItem>>>>

  beforeEach(async () => {
    const { address } = await wallet()
    page = await get<Page<ExplorerItem>>(`${EXPLORER_URL}/${address}/emotes?pageSize=3&pageNum=1`)
  })

  it('should answer a page of at most the requested size', () => {
    expect([page.status, page.body.elements.length <= 3]).toEqual([200, true])
  })
})
