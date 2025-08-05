import { EmoteCategory, Entity } from '@dcl/schemas'
import { extractEmoteDefinitionFromEntity } from '../../src/adapters/definitions'
import { EmoteFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { leastRare, nameAZ, nameZA, rarest } from '../../src/logic/sorting'
import { SORTED_RARITIES } from '../../src/logic/utils'
import { OnChainEmoteResponse, OnChainEmote } from '../../src/types'
import { test } from '../components'
import { generateEmoteContentDefinitions, generateEmotes } from '../data/emotes'
import { generateRandomAddress } from '../helpers'

// NOTE: each test generates a new wallet to avoid matches on cache

// Helper function to convert EmoteFromQuery to OnChainEmote format
function convertEmoteToOnChainEmote(emote: EmoteFromQuery): OnChainEmote {
  return {
    urn: emote.urn,
    amount: 1,
    individualData: [
      {
        id: `${emote.urn}:${emote.tokenId}`,
        tokenId: emote.tokenId,
        transferredAt: emote.transferredAt,
        price: emote.item.price
      }
    ],
    name: emote.metadata.emote.name,
    rarity: emote.item.rarity,
    minTransferredAt: emote.transferredAt,
    maxTransferredAt: emote.transferredAt,
    category: emote.metadata.emote.category
  }
}

test('emotes-handler: GET /users/:address/emotes should', function ({ components }) {
  it('return empty when no emotes are found', async () => {
    const { localFetch } = components

    // Mock marketplace API with no emotes
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: [],
      total: 0
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return empty when no emotes are found with includeDefinitions set', async () => {
    const { localFetch, content } = components

    // Mock marketplace API with no emotes
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: [],
      total: 0
    })

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce([])

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [],
      pageNum: 1,
      totalAmount: 0,
      pageSize: 100
    })
  })

  it('return a emote from matic collection', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(1)

    // Mock marketplace API with single emote
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: emotes.map(convertEmoteToOnChainEmote),
      total: 1
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return emotes with includeDefinitions set', async () => {
    const { localFetch, content, contentServerUrl } = components
    const emotes = generateEmotes(1)
    const definitions = generateEmoteContentDefinitions(emotes.map((emote) => emote.urn))

    // Mock marketplace API with single emote
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: emotes.map(convertEmoteToOnChainEmote),
      total: 1
    })

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes, { definitions, contentServerUrl, includeDefinition: true }),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return emotes with includeEntities set', async () => {
    const { localFetch, content, contentServerUrl } = components
    const emotes = generateEmotes(1)
    const definitions = generateEmoteContentDefinitions(emotes.map((emote) => emote.urn))

    // Mock marketplace API with single emote
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: emotes.map(convertEmoteToOnChainEmote),
      total: 1
    })

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?includeEntities`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel(emotes, { definitions, contentServerUrl, includeEntity: true }),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 1
    })
  })

  it('return a emote with definition and another one without definition', async () => {
    const { localFetch, content, contentServerUrl } = components
    const emotes = generateEmotes(2)
    const definitions = generateEmoteContentDefinitions([emotes[0].urn])

    // modify emote urn to avoid cache hit
    emotes[1] = { ...emotes[1], urn: 'anotherUrn' }

    // Mock marketplace API with emotes in expected order (sorted by rarest by default)
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: [emotes[1], emotes[0]].map(convertEmoteToOnChainEmote),
      total: 2
    })

    content.fetchEntitiesByPointers = jest.fn().mockResolvedValueOnce(definitions)

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?includeDefinitions`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[1], emotes[0]], { definitions, contentServerUrl, includeDefinition: true }),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 2
    })
  })

  it('return emotes 2 and paginate them correctly (page 1, size 2, total 5)', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(5)

    // Mock marketplace API to return paginated results directly (like wearables-handler)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [emotes[0], emotes[1]].map(convertEmoteToOnChainEmote), // Only first 2 emotes for page 1
      total: 5
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?pageSize=2&pageNum=1`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[0], emotes[1]]),
      pageNum: 1,
      pageSize: 2,
      totalAmount: 5
    })

    // Verify marketplace API was called with correct pagination
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 2,
        offset: 0
      })
    )
  })

  it('return emotes 2 and paginate them correctly (page 2, size 2, total 5)', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(5)

    // Mock marketplace API to return paginated results for page 2
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [emotes[2], emotes[3]].map(convertEmoteToOnChainEmote), // Emotes 2-3 for page 2
      total: 5
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?pageSize=2&pageNum=2`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[2], emotes[3]]),
      pageNum: 2,
      pageSize: 2,
      totalAmount: 5
    })

    // Verify marketplace API was called with correct pagination for page 2
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 2,
        offset: 2
      })
    )
  })

  it('return emotes 2 and paginate them correctly (page 3, size 2, total 5)', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(5)

    // Mock marketplace API to return paginated results for page 3
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [emotes[4]].map(convertEmoteToOnChainEmote), // Only emote 4 for page 3
      total: 5
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?pageSize=2&pageNum=3`)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: convertToDataModel([emotes[4]]),
      pageNum: 3,
      pageSize: 2,
      totalAmount: 5
    })

    // Verify marketplace API was called with correct pagination for page 3
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 2,
        offset: 4
      })
    )
  })

  it('return emotes from cache on second call for the same address (case insensitive)', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(7)
    const wallet = generateRandomAddress()

    // Mock marketplace API to be case-insensitive and track calls
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes')
    let callCount = 0
    fetchUserEmotesSpy.mockImplementation(async (address: string) => {
      callCount++
      // Normalize to lowercase for comparison
      const normalizedAddress = address.toLowerCase()
      const expectedAddress = wallet.toLowerCase()

      if (normalizedAddress === expectedAddress) {
        return {
          emotes: emotes.map(convertEmoteToOnChainEmote),
          total: 7
        }
      }
      throw new Error(`Unexpected address: ${address}`)
    })

    const r = await localFetch.fetch(`/users/${wallet}/emotes`)
    const rBody = await r.json()

    expect(r.status).toBe(200)
    expect(rBody).toEqual({
      elements: convertToDataModel(emotes),
      pageNum: 1,
      pageSize: 100,
      totalAmount: 7
    })

    const r2 = await localFetch.fetch(`/users/${wallet.toUpperCase()}/emotes`)
    expect(r2.status).toBe(r.status)
    expect(await r2.json()).toEqual(rBody)

    // Verify marketplace API was only called once due to cache (case insensitive)
    expect(callCount).toBe(1)
  })

  it('return emotes filtering by name', async () => {
    const { localFetch } = components

    // Mock marketplace API with emotes that match the name filter (following wearables-handler pattern)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [
        {
          urn: 'urn:decentraland:matic:collections:0x123:4',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections:0x123:4:1',
              tokenId: '1',
              transferredAt: Date.now(),
              price: 100
            }
          ],
          name: 'emote 4',
          rarity: 'uncommon',
          minTransferredAt: Date.now(),
          maxTransferredAt: Date.now(),
          category: EmoteCategory.DANCE
        }
      ],
      total: 1
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?name=4`)

    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify marketplace API was called with name filter
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: '4',
        limit: expect.any(Number),
        offset: expect.any(Number)
      })
    )
    expect(response.elements.length).toBe(1)
    expect(response.elements[0].name).toBe('emote 4')
  })

  it('return emotes filtering by category', async () => {
    const { localFetch } = components

    // Mock marketplace API with emotes that match the category filter (following wearables-handler pattern)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [
        {
          urn: 'urn:decentraland:matic:collections:0x456:1',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections:0x456:1:1',
              tokenId: '1',
              transferredAt: Date.now(),
              price: 200
            }
          ],
          name: 'Cool Dance',
          rarity: 'rare',
          minTransferredAt: Date.now(),
          maxTransferredAt: Date.now(),
          category: EmoteCategory.DANCE
        }
      ],
      total: 1
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?category=dance`)

    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify marketplace API was called with category filter
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        category: 'dance',
        limit: expect.any(Number),
        offset: expect.any(Number)
      })
    )
    expect(response.elements.length).toBe(1)
    expect(response.elements[0].category).toBe(EmoteCategory.DANCE)
  })

  it('return emotes filtering by rarity', async () => {
    const { localFetch } = components

    // Mock marketplace API with emotes that match the rarity filter (following wearables-handler pattern)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [
        {
          urn: 'urn:decentraland:matic:collections:0x789:1',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections:0x789:1:1',
              tokenId: '1',
              transferredAt: Date.now(),
              price: 300
            }
          ],
          name: 'Rare Emote',
          rarity: 'rare',
          minTransferredAt: Date.now(),
          maxTransferredAt: Date.now(),
          category: EmoteCategory.FUN
        }
      ],
      total: 1
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?rarity=rare`)

    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify marketplace API was called with rarity filter
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        rarity: 'rare',
        limit: expect.any(Number),
        offset: expect.any(Number)
      })
    )
    expect(response.elements.length).toBe(1)
    expect(response.elements[0].rarity).toBe('rare')
  })

  it('return emotes sorted by newest / oldest', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(17).map((w, i) => ({
      ...w,
      transferredAt: w.transferredAt + i
    }))

    const wallet = generateRandomAddress()

    // Mock marketplace API to return sorted emotes (newest first for DESC)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes')

    // First call: newest first (DESC order)
    fetchUserEmotesSpy.mockResolvedValueOnce({
      emotes: [...emotes].reverse().map(convertEmoteToOnChainEmote),
      total: 17
    })

    // Second call: oldest first (ASC order)
    fetchUserEmotesSpy.mockResolvedValueOnce({
      emotes: emotes.map(convertEmoteToOnChainEmote),
      total: 17
    })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&orderBy=date&direction=DESC`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes)].reverse(),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&orderBy=date&direction=ASC`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes)],
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return emotes sorted by rarest / least_rare', async () => {
    const { localFetch } = components

    // Mock marketplace API with sorted emotes (following wearables-handler pattern)
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes').mockResolvedValue({
      emotes: [
        {
          urn: 'urn:decentraland:matic:collections:0x111:2',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections:0x111:2:1',
              tokenId: '1',
              transferredAt: Date.now(),
              price: 300
            }
          ],
          name: 'Epic Emote',
          rarity: 'epic',
          minTransferredAt: Date.now(),
          maxTransferredAt: Date.now(),
          category: EmoteCategory.FUN
        },
        {
          urn: 'urn:decentraland:matic:collections:0x111:1',
          amount: 1,
          individualData: [
            {
              id: 'urn:decentraland:matic:collections:0x111:1:1',
              tokenId: '1',
              transferredAt: Date.now(),
              price: 150
            }
          ],
          name: 'Common Emote',
          rarity: 'common',
          minTransferredAt: Date.now(),
          maxTransferredAt: Date.now(),
          category: EmoteCategory.DANCE
        }
      ],
      total: 2
    })

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?orderBy=rarity&direction=DESC`)

    expect(r.status).toBe(200)
    const response = await r.json()

    // Verify marketplace API was called with sorting params
    expect(fetchUserEmotesSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        orderBy: 'rarity',
        direction: 'DESC',
        limit: expect.any(Number),
        offset: expect.any(Number)
      })
    )
    expect(response.elements.length).toBe(2)
    expect(response.elements[0].rarity).toBe('epic')
    expect(response.elements[1].rarity).toBe('common')
  })

  it('return emotes sorted by name_a_z / name_z_a', async () => {
    const { localFetch } = components
    const emotes = generateEmotes(17)

    const wallet = generateRandomAddress()

    // Mock marketplace API to return sorted emotes
    const fetchUserEmotesSpy = jest.spyOn(components.marketplaceApiFetcher!, 'fetchUserEmotes')

    // First call: name A-Z (ASC order)
    const nameAZSorted = [...emotes].sort((a, b) => a.metadata.emote.name.localeCompare(b.metadata.emote.name))
    fetchUserEmotesSpy.mockResolvedValueOnce({
      emotes: nameAZSorted.map(convertEmoteToOnChainEmote),
      total: 17
    })

    // Second call: name Z-A (DESC order)
    const nameZASorted = [...emotes].sort((a, b) => b.metadata.emote.name.localeCompare(a.metadata.emote.name))
    fetchUserEmotesSpy.mockResolvedValueOnce({
      emotes: nameZASorted.map(convertEmoteToOnChainEmote),
      total: 17
    })

    const r = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&orderBy=name&direction=ASC`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(nameAZ),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })

    const r2 = await localFetch.fetch(`/users/${wallet}/emotes?pageSize=20&pageNum=1&orderBy=name&direction=DESC`)
    expect(r2.status).toBe(200)
    expect(await r2.json()).toEqual({
      elements: [...convertToDataModel(emotes)].sort(nameZA),
      pageNum: 1,
      pageSize: 20,
      totalAmount: 17
    })
  })

  it('return an error when invalid sorting spec requested', async () => {
    const { localFetch } = components

    // Don't mock anything - validation should fail before any external calls
    const addressString = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${addressString}/emotes?orderBy=saraza`)

    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({
      error: 'Bad request',
      message: 'Invalid sorting requested: saraza DESC'
    })

    const r2 = await localFetch.fetch(`/users/${addressString}/emotes?orderBy=rarity&direction=ARRIBA`)

    expect(r2.status).toBe(400)
    expect(await r2.json()).toEqual({
      error: 'Bad request',
      message: 'Invalid sorting requested: rarity ARRIBA'
    })
  })

  it('return an error when emotes cannot be fetched from matic collection', async () => {
    const { localFetch } = components

    // Mock marketplace API to fail with error (no fallback)
    components.marketplaceApiFetcher!.fetchUserEmotes = jest
      .fn()
      .mockRejectedValue(new Error('Cannot fetch emotes from marketplace API'))

    const wallet = generateRandomAddress()
    const r = await localFetch.fetch(`/users/${wallet}/emotes`)

    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({
      error: 'The requested items cannot be fetched right now',
      message: `Cannot fetch elements for ${wallet}`
    })
  })

  it('return a generic error when an unexpected error occurs (definitions cannot be fetched)', async () => {
    const { localFetch, content } = components
    const emotes = generateEmotes(2)

    // modify emote urn to avoid cache hit
    emotes[1] = { ...emotes[1], urn: 'anotherUrn' }

    // Mock marketplace API successfully
    components.marketplaceApiFetcher!.fetchUserEmotes = jest.fn().mockResolvedValue({
      emotes: [emotes[1], emotes[0]].map(convertEmoteToOnChainEmote),
      total: 2
    })

    // Mock content service to fail when fetching definitions
    content.fetchEntitiesByPointers = jest.fn().mockRejectedValueOnce(new Error(`Cannot fetch definitions`))

    const r = await localFetch.fetch(`/users/${generateRandomAddress()}/emotes?includeDefinitions`)

    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({
      error: 'Internal Server Error'
    })
  })
})

type ContentInfo = {
  definitions: Entity[]
  contentServerUrl: string
  includeEntity?: boolean
  includeDefinition?: boolean
}

function convertToDataModel(emotes: EmoteFromQuery[], contentInfo?: ContentInfo): OnChainEmoteResponse[] {
  return emotes.map((emote): OnChainEmoteResponse => {
    const individualData = {
      id: `${emote.urn}:${emote.tokenId}`,
      tokenId: emote.tokenId,
      transferredAt: String(emote.transferredAt),
      price: String(emote.item.price)
    }
    const rarity = emote.item.rarity
    const entity = contentInfo?.definitions.find((def) => def.id === emote.urn)
    const contentServerUrl = contentInfo?.contentServerUrl
    return {
      urn: emote.urn,
      amount: 1,
      individualData: [individualData],
      category: emote.metadata.emote.category,
      name: emote.metadata.emote.name,
      rarity,
      definition:
        contentInfo?.includeDefinition && entity
          ? extractEmoteDefinitionFromEntity({ contentServerUrl }, entity)
          : undefined,
      entity: contentInfo?.includeEntity && entity ? entity : undefined
    }
  })
}
