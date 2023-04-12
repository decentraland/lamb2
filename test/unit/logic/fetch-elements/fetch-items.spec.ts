import { createTheGraphComponentMock } from "../../../mocks/the-graph-mock"
import { Item } from '../../../../src/types'
import { fetchAllEmotes, fetchAllWearables, ItemFromQuery } from "../../../../src/logic/fetch-elements/fetch-items"

describe('fetchEmotes', () => {
  it('the maticCollectionsSubgraph is queried', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({ nfts: [] })
    const owner = 'anOwner'
    await fetchAllEmotes({ theGraph }, owner)
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalled()
    const expectedQuery =
      `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "emote"},
      orderBy: id,
      orderDirection: asc,
      first: 1000
    ) {
      urn,
      id,
      tokenId,
      category
      transferredAt,
      item {
        rarity,
        price
      }
    }
  }`
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalledWith(
      expectedQuery,
      expect.objectContaining({ owner: owner.toLowerCase() })
    )
  })

  it('emotes are mapped correctly', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 10 } }
      ] as ItemFromQuery[]
    })
    const emotes = await fetchAllEmotes({ theGraph }, 'anOwner')
    expect(emotes).toEqual([
      {
        urn: 'urn1',
        amount: 1,
        individualData: [
          { id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 10 }
        ],
        rarity: 'common'
      }
    ] as Item[])
  })

  it('emotes are grouped by urn', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 10 } },
        { urn: 'urn1', id: 'id2', tokenId: 'tokenId2', transferredAt: 2, item: { rarity: 'common', price: 15 } },
        { urn: 'urn5', id: 'id5', tokenId: 'tokenId5', transferredAt: 5, item: { rarity: 'rarity5', price: 5 } }
      ] as ItemFromQuery[]
    })
    const emotes = await fetchAllEmotes({ theGraph }, 'anOwner')
    expect(emotes).toEqual([
      {
        urn: 'urn1',
        amount: 2,
        individualData: [
          { id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 10 },
          { id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 15 }
        ],
        rarity: 'common'
      },
      {
        urn: 'urn5',
        amount: 1,
        individualData: [
          { id: 'id5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }
        ],
        rarity: 'rarity5'
      }
    ] as Item[])
  })

  it('emotes are sorted by rarity', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 1 } },
        { urn: 'urn2', id: 'id2', tokenId: 'tokenId2', transferredAt: 2, item: { rarity: 'rare', price: 2 } },
        { urn: 'urn3', id: 'id3', tokenId: 'tokenId3', transferredAt: 3, item: { rarity: 'unique', price: 3 } }
      ] as ItemFromQuery[]
    })
    const emotes = await fetchAllEmotes({ theGraph }, 'anOwner')
    expect(emotes).toEqual([
      {
        urn: 'urn3',
        amount: 1,
        individualData: [{ id: 'id3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
        rarity: 'unique'
      },
      {
        urn: 'urn2',
        amount: 1,
        individualData: [{ id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
        rarity: 'rare'
      },
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
        rarity: 'common'
      }
    ] as Item[])
  })
})

describe('fetchWearables', () => {
  it('the ethereumCollectionsSubgraph and maticCollectionsSubgraph are queried', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({ nfts: [] })
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({ nfts: [] })
    const owner = 'anOwner'
    await fetchAllWearables({ theGraph }, owner)
    expect(theGraph.ethereumCollectionsSubgraph.query).toBeCalled()
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalled()
    const expectedQuery =
      `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "wearable"},
      orderBy: id,
      orderDirection: asc,
      first: 1000
    ) {
      urn,
      id,
      tokenId,
      category
      transferredAt,
      item {
        rarity,
        price
      }
    }
  }`
    expect(theGraph.ethereumCollectionsSubgraph.query).toBeCalledWith(
      expectedQuery,
      expect.objectContaining({ owner: owner.toLowerCase() })
    )
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalledWith(
      expectedQuery,
      expect.objectContaining({ owner: owner.toLowerCase() })
    )
  })

  it('wearables are mapped correctly', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 1 } }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn2', id: 'id2', tokenId: 'tokenId2', transferredAt: 2, item: { rarity: 'common', price: 2 } }
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual([
      {
        urn: 'urn1',
        amount: 1,
        individualData: [
          { id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }
        ],
        rarity: 'common'
      },
      {
        urn: 'urn2',
        amount: 1,
        individualData: [
          { id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }
        ],
        rarity: 'common'
      }
    ] as Item[])
  })

  it('wearables are grouped by urn', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 10 } },
        { urn: 'urn5', id: 'id5', tokenId: 'tokenId5', transferredAt: 5, item: { rarity: 'unique', price: 5 } }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id2', tokenId: 'tokenId2', transferredAt: 2, item: { rarity: 'common', price: 15 } },
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual(expect.arrayContaining([
      {
        urn: 'urn1',
        amount: 2,
        individualData: [
          { id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 10 },
          { id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 15 }
        ],
        rarity: 'common'
      },
      {
        urn: 'urn5',
        amount: 1,
        individualData: [
          { id: 'id5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }
        ],
        rarity: 'unique'
      }
    ] as Item[]))
  })

  it('wearables are sorted by rarity', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn1', id: 'id1', tokenId: 'tokenId1', transferredAt: 1, item: { rarity: 'common', price: 1 } },
        { urn: 'urn3', id: 'id3', tokenId: 'tokenId3', transferredAt: 3, item: { rarity: 'unique', price: 3 } }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        { urn: 'urn2', id: 'id2', tokenId: 'tokenId2', transferredAt: 2, item: { rarity: 'rare', price: 2 } },
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual([
      {
        urn: 'urn3',
        amount: 1,
        individualData: [{ id: 'id3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
        rarity: 'unique'
      },
      {
        urn: 'urn2',
        amount: 1,
        individualData: [{ id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
        rarity: 'rare'
      },
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
        rarity: 'common'
      }
    ] as Item[])
  })
})