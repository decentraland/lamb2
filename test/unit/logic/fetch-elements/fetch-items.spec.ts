import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'
import { Item } from '../../../../src/types'
import { fetchAllEmotes, fetchAllWearables, ItemFromQuery } from '../../../../src/logic/fetch-elements/fetch-items'
import { EmoteCategory, WearableCategory } from '@dcl/schemas'

describe('fetchEmotes', () => {
  it('the maticCollectionsSubgraph is queried', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({ nfts: [] })
    const owner = 'anOwner'
    await fetchAllEmotes({ theGraph }, owner)
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalled()
    const expectedQuery = `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "emote"},
      orderBy: id,
      orderDirection: asc,
      first: 1000
    ) {
      urn,
      id,
      tokenId,
      category,
      transferredAt,
      metadata {
        emote {
          name,
          category
        }
      },
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
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 10 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'common emote',
              category: EmoteCategory.FUN
            }
          }
        }
      ] as ItemFromQuery[]
    })
    const emotes = await fetchAllEmotes({ theGraph }, 'anOwner')
    expect(emotes).toEqual([
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 10 }],
        rarity: 'common',
        category: EmoteCategory.FUN,
        maxTransferredAt: 1,
        minTransferredAt: 1,
        name: 'common emote'
      }
    ] as Item[])
  })

  it('emotes are grouped by urn', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 10 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'common fun',
              category: EmoteCategory.FUN
            }
          }
        },
        {
          urn: 'urn1',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'common', price: 15 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'common fun',
              category: EmoteCategory.DANCE
            }
          }
        },
        {
          urn: 'urn5',
          id: 'id5',
          tokenId: 'tokenId5',
          transferredAt: 5,
          item: { rarity: 'rarity5', price: 5 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'common dance',
              category: EmoteCategory.DANCE
            }
          }
        }
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
        rarity: 'common',
        category: EmoteCategory.FUN,
        maxTransferredAt: 2,
        minTransferredAt: 1,
        name: 'common fun'
      },
      {
        urn: 'urn5',
        amount: 1,
        individualData: [{ id: 'id5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }],
        rarity: 'rarity5',
        category: EmoteCategory.DANCE,
        maxTransferredAt: 5,
        minTransferredAt: 5,
        name: 'common dance'
      }
    ] as Item[])
  })

  it('emotes are sorted by rarity', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 1 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'fun emote',
              category: EmoteCategory.FUN
            }
          }
        },
        {
          urn: 'urn2',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'rare', price: 2 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'dance emote',
              category: EmoteCategory.DANCE
            }
          }
        },
        {
          urn: 'urn3',
          id: 'id3',
          tokenId: 'tokenId3',
          transferredAt: 3,
          item: { rarity: 'unique', price: 3 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'horror emote',
              category: EmoteCategory.HORROR
            }
          }
        }
      ] as ItemFromQuery[]
    })
    const emotes = await fetchAllEmotes({ theGraph }, 'anOwner')
    expect(emotes).toEqual([
      {
        urn: 'urn3',
        amount: 1,
        individualData: [{ id: 'id3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
        rarity: 'unique',
        category: EmoteCategory.HORROR,
        maxTransferredAt: 3,
        minTransferredAt: 3,
        name: 'horror emote'
      },
      {
        urn: 'urn2',
        amount: 1,
        individualData: [{ id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
        rarity: 'rare',
        category: EmoteCategory.DANCE,
        maxTransferredAt: 2,
        minTransferredAt: 2,
        name: 'dance emote'
      },
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
        rarity: 'common',
        category: EmoteCategory.FUN,
        maxTransferredAt: 1,
        minTransferredAt: 1,
        name: 'fun emote'
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
    const expectedQuery = `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "wearable"},
      orderBy: id,
      orderDirection: asc,
      first: 1000
    ) {
      urn,
      id,
      tokenId,
      category,
      transferredAt,
      metadata {
        wearable {
          name,
          category
        }
      },
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
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 1 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'fun emote',
              category: EmoteCategory.FUN
            }
          }
        }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn2',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'common', price: 2 },
          category: 'emote',
          metadata: {
            emote: {
              name: 'dance emote',
              category: EmoteCategory.DANCE
            }
          }
        }
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual([
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
        rarity: 'common',
        name: 'fun emote',
        category: EmoteCategory.FUN,
        maxTransferredAt: 1,
        minTransferredAt: 1
      } as Item,
      {
        urn: 'urn2',
        amount: 1,
        individualData: [{ id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
        rarity: 'common',
        name: 'dance emote',
        category: EmoteCategory.DANCE,
        maxTransferredAt: 2,
        minTransferredAt: 2
      }
    ] as Item[])
  })

  it('wearables are grouped by urn', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 10 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'common eyebrows',
              category: WearableCategory.EYEBROWS
            }
          }
        },
        {
          urn: 'urn1',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'common', price: 15 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'common eyebrows',
              category: WearableCategory.EYEBROWS
            }
          }
        }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn5',
          id: 'id5',
          tokenId: 'tokenId5',
          transferredAt: 5,
          item: { rarity: 'unique', price: 5 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'unique earring',
              category: WearableCategory.EARRING
            }
          }
        }
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual([
      {
        urn: 'urn5',
        amount: 1,
        individualData: [{ id: 'id5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }],
        rarity: 'unique',
        category: WearableCategory.EARRING,
        maxTransferredAt: 5,
        minTransferredAt: 5,
        name: 'unique earring'
      },
      {
        urn: 'urn1',
        amount: 2,
        individualData: [
          { id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 10 },
          { id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 15 }
        ],
        rarity: 'common',
        category: WearableCategory.EYEBROWS,
        maxTransferredAt: 2,
        minTransferredAt: 1,
        name: 'common eyebrows'
      }
    ] as Item[])
  })

  it('wearables are sorted by rarity', async () => {
    const theGraph = createTheGraphComponentMock()
    jest.spyOn(theGraph.ethereumCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn1',
          id: 'id1',
          tokenId: 'tokenId1',
          transferredAt: 1,
          item: { rarity: 'common', price: 1 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'common eyebrows',
              category: WearableCategory.EYEBROWS
            }
          }
        },
        {
          urn: 'urn3',
          id: 'id3',
          tokenId: 'tokenId3',
          transferredAt: 3,
          item: { rarity: 'unique', price: 3 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'unique eyes',
              category: WearableCategory.EYES
            }
          }
        }
      ] as ItemFromQuery[]
    })
    jest.spyOn(theGraph.maticCollectionsSubgraph, 'query').mockResolvedValue({
      nfts: [
        {
          urn: 'urn2',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'rare', price: 2 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'rare eyes',
              category: WearableCategory.EYES
            }
          }
        }
      ] as ItemFromQuery[]
    })
    const wearables = await fetchAllWearables({ theGraph }, 'anOwner')
    expect(wearables).toEqual([
      {
        urn: 'urn3',
        amount: 1,
        individualData: [{ id: 'id3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
        rarity: 'unique',
        category: 'eyes',
        maxTransferredAt: 3,
        minTransferredAt: 3,
        name: 'unique eyes'
      },
      {
        urn: 'urn2',
        amount: 1,
        individualData: [{ id: 'id2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
        rarity: 'rare',
        category: 'eyes',
        maxTransferredAt: 2,
        minTransferredAt: 2,
        name: 'rare eyes'
      },
      {
        urn: 'urn1',
        amount: 1,
        individualData: [{ id: 'id1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
        rarity: 'common',
        category: 'eyebrows',
        maxTransferredAt: 1,
        minTransferredAt: 1,
        name: 'common eyebrows'
      }
    ] as Item[])
  })
})
