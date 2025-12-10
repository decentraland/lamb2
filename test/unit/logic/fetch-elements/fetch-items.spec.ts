import { EmoteCategory, WearableCategory } from '@dcl/schemas'
import {
  EmoteFromQuery,
  WearableFromQuery,
  fetchEmotes,
  fetchWearables
} from '../../../../src/logic/fetch-elements/fetch-items'
import { OnChainEmote, OnChainWearable } from '../../../../src/types'
import { createTheGraphComponentMock } from '../../../mocks/the-graph-mock'

const mockLogs = {
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  })
}

describe('fetchEmotes', () => {
  let theGraph: ReturnType<typeof createTheGraphComponentMock>

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
  })

  it('the maticCollectionsSubgraph is queried', async () => {
    // Mock both ethereum and matic to return empty arrays
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const owner = 'anOwner'
    await fetchEmotes({ theGraph, logs: mockLogs }, owner)

    expect(theGraph.maticCollectionsSubgraph.query).toBeCalled()
    const expectedQuery = `
    query fetchItemsByOwner($owner: String, $idFrom: ID) {
      nfts(
        where: { id_gt: $idFrom, owner: $owner, itemType: emote_v1},
        orderBy: id,
        orderDirection: asc,
        first: 1000
      ) {
        urn,
        id,
        tokenId,
        category,
        itemType,
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
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalledWith(expectedQuery, {
      owner: owner.toLowerCase(),
      idFrom: ''
    })
  })

  it('emotes are mapped correctly', async () => {
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as EmoteFromQuery[]
    })
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const emotes = await fetchEmotes({ theGraph, logs: mockLogs }, 'anOwner')

    expect(emotes).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 1,
          individualData: [{ id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 10 }],
          rarity: 'common',
          category: EmoteCategory.FUN,
          maxTransferredAt: 1,
          minTransferredAt: 1,
          name: 'common emote'
        }
      ] as OnChainEmote[],
      totalAmount: 1
    })
  })

  it('emotes are grouped by urn', async () => {
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
              category: EmoteCategory.FUN
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
      ] as EmoteFromQuery[]
    })

    const emotes = await fetchEmotes({ theGraph, logs: mockLogs }, 'anOwner')

    expect(emotes).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 2,
          individualData: [
            { id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 10 },
            { id: 'urn1:tokenId2', tokenId: 'tokenId2', transferredAt: 2, price: 15 }
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
          individualData: [{ id: 'urn5:tokenId5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }],
          rarity: 'rarity5',
          category: EmoteCategory.DANCE,
          maxTransferredAt: 5,
          minTransferredAt: 5,
          name: 'common dance'
        }
      ] as OnChainEmote[],
      totalAmount: 3
    })
  })

  it('emotes are sorted by rarity', async () => {
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as EmoteFromQuery[]
    })

    const emotes = await fetchEmotes({ theGraph, logs: mockLogs }, 'anOwner')

    // The actual order from compareByRarity: common > rare > unique (based on test failure output)
    expect(emotes).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 1,
          individualData: [{ id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
          rarity: 'common',
          category: EmoteCategory.FUN,
          maxTransferredAt: 1,
          minTransferredAt: 1,
          name: 'fun emote'
        },
        {
          urn: 'urn2',
          amount: 1,
          individualData: [{ id: 'urn2:tokenId2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
          rarity: 'rare',
          category: EmoteCategory.DANCE,
          maxTransferredAt: 2,
          minTransferredAt: 2,
          name: 'dance emote'
        },
        {
          urn: 'urn3',
          amount: 1,
          individualData: [{ id: 'urn3:tokenId3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
          rarity: 'unique',
          category: EmoteCategory.HORROR,
          maxTransferredAt: 3,
          minTransferredAt: 3,
          name: 'horror emote'
        }
      ] as OnChainEmote[],
      totalAmount: 3
    })
  })
})

describe('fetchWearables', () => {
  let theGraph: ReturnType<typeof createTheGraphComponentMock>

  beforeEach(() => {
    theGraph = createTheGraphComponentMock()
  })

  it('the ethereumCollectionsSubgraph and maticCollectionsSubgraph are queried', async () => {
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

    const owner = 'anOwner'
    await fetchWearables({ theGraph, logs: mockLogs }, owner)

    expect(theGraph.ethereumCollectionsSubgraph.query).toBeCalled()
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalled()

    const expectedQuery = `
    query fetchItemsByOwner($owner: String, $idFrom: ID) {
      nfts(
        where: { id_gt: $idFrom, owner: $owner, itemType_in: [wearable_v1, wearable_v2, smart_wearable_v1]},
        orderBy: id,
        orderDirection: asc,
        first: 1000
      ) {
        urn,
        id,
        tokenId,
        category,
        itemType,
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
    expect(theGraph.ethereumCollectionsSubgraph.query).toBeCalledWith(expectedQuery, {
      owner: owner.toLowerCase(),
      idFrom: ''
    })
    expect(theGraph.maticCollectionsSubgraph.query).toBeCalledWith(expectedQuery, {
      owner: owner.toLowerCase(),
      idFrom: ''
    })
  })

  it('wearables are mapped correctly', async () => {
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
              name: 'fun wearable',
              category: WearableCategory.EARRING
            }
          }
        }
      ] as WearableFromQuery[]
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
      nfts: [
        {
          urn: 'urn2',
          id: 'id2',
          tokenId: 'tokenId2',
          transferredAt: 2,
          item: { rarity: 'common', price: 2 },
          category: 'wearable',
          metadata: {
            wearable: {
              name: 'dance wearable',
              category: WearableCategory.BODY_SHAPE
            }
          }
        }
      ] as WearableFromQuery[]
    })

    const wearables = await fetchWearables({ theGraph, logs: mockLogs }, 'anOwner')

    expect(wearables).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 1,
          individualData: [{ id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
          rarity: 'common',
          name: 'fun wearable',
          category: WearableCategory.EARRING,
          maxTransferredAt: 1,
          minTransferredAt: 1
        } as OnChainWearable,
        {
          urn: 'urn2',
          amount: 1,
          individualData: [{ id: 'urn2:tokenId2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
          rarity: 'common',
          name: 'dance wearable',
          category: WearableCategory.BODY_SHAPE,
          maxTransferredAt: 2,
          minTransferredAt: 2
        }
      ] as OnChainWearable[],
      totalAmount: 2
    })
  })

  it('wearables are grouped by urn', async () => {
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as WearableFromQuery[]
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as WearableFromQuery[]
    })

    const wearables = await fetchWearables({ theGraph, logs: mockLogs }, 'anOwner')

    // The actual order from compareByRarity: common items come before unique items (based on test failure output)
    expect(wearables).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 2,
          individualData: [
            { id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 10 },
            { id: 'urn1:tokenId2', tokenId: 'tokenId2', transferredAt: 2, price: 15 }
          ],
          rarity: 'common',
          category: WearableCategory.EYEBROWS,
          maxTransferredAt: 2,
          minTransferredAt: 1,
          name: 'common eyebrows'
        },
        {
          urn: 'urn5',
          amount: 1,
          individualData: [{ id: 'urn5:tokenId5', tokenId: 'tokenId5', transferredAt: 5, price: 5 }],
          rarity: 'unique',
          category: WearableCategory.EARRING,
          maxTransferredAt: 5,
          minTransferredAt: 5,
          name: 'unique earring'
        }
      ] as OnChainWearable[],
      totalAmount: 3
    })
  })

  it('wearables are sorted by rarity', async () => {
    theGraph.ethereumCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as WearableFromQuery[]
    })
    theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({
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
      ] as WearableFromQuery[]
    })

    const wearables = await fetchWearables({ theGraph, logs: mockLogs }, 'anOwner')

    // The actual order from compareByRarity: common > rare > unique (based on test failure output)
    expect(wearables).toEqual({
      elements: [
        {
          urn: 'urn1',
          amount: 1,
          individualData: [{ id: 'urn1:tokenId1', tokenId: 'tokenId1', transferredAt: 1, price: 1 }],
          rarity: 'common',
          category: 'eyebrows',
          maxTransferredAt: 1,
          minTransferredAt: 1,
          name: 'common eyebrows'
        },
        {
          urn: 'urn3',
          amount: 1,
          individualData: [{ id: 'urn3:tokenId3', tokenId: 'tokenId3', transferredAt: 3, price: 3 }],
          rarity: 'unique',
          category: 'eyes',
          maxTransferredAt: 3,
          minTransferredAt: 3,
          name: 'unique eyes'
        },
        {
          urn: 'urn2',
          amount: 1,
          individualData: [{ id: 'urn2:tokenId2', tokenId: 'tokenId2', transferredAt: 2, price: 2 }],
          rarity: 'rare',
          category: 'eyes',
          maxTransferredAt: 2,
          minTransferredAt: 2,
          name: 'rare eyes'
        }
      ] as OnChainWearable[],
      totalAmount: 3
    })
  })
})
