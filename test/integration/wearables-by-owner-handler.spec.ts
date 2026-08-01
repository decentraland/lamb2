import { Entity, EntityType, Wearable, WearableCategory } from '@dcl/schemas'
import { createMarketplaceApiFetcherMock } from '../mocks/marketplace-api-mock'
import { testWithComponents } from '../components'
import { generateWearables } from '../data/wearables'
import { generateRandomAddress } from '../helpers'

function buildWearableEntity(urn: string, name: string): Entity {
  return {
    version: 'v3',
    id: 'bafkreig' + urn,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: 0,
    content: [],
    metadata: {
      id: urn,
      name,
      description: '',
      i18n: [{ code: 'en', text: name }],
      thumbnail: 'thumb.png',
      image: 'img.png',
      data: { tags: [], category: WearableCategory.HAT, hides: [], replaces: [], representations: [] }
    } as Wearable
  }
}

const testWith = testWithComponents(() => {
  const wearables = generateWearables(3)
  const marketplaceApiFetcher = createMarketplaceApiFetcherMock({ wearables, shouldFail: false })
  return { marketplaceApiFetcher }
})

testWith('wearables-by-owner-handler: GET /collections/wearables-by-owner/:owner', function ({ components }) {
  describe('when the owner has on-chain wearables', () => {
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      address = generateRandomAddress()
      response = await components.localFetch.fetch(`/collections/wearables-by-owner/${address}`)
      body = await response.json()
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should return one urn+amount entry per owned wearable and omit the definition field', () => {
      expect(body).toHaveLength(3)
      for (const entry of body) {
        expect(entry).toEqual({ urn: expect.any(String), amount: expect.any(Number) })
        expect(entry).not.toHaveProperty('definition')
      }
    })
  })

  describe('when called with ?collectionId pointing at a non-third-party URN', () => {
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      address = generateRandomAddress()
      response = await components.localFetch.fetch(
        `/collections/wearables-by-owner/${address}?collectionId=urn:decentraland:off-chain:base-avatars`
      )
      body = await response.json()
    })

    it('should respond 400 with the lamb2 error-middleware shape', () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ error: 'Bad request' })
    })
  })

  describe('when called with ?includeDefinitions', () => {
    let address: string
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: Array<{ urn: string; amount: number; definition?: { id: string; name: string } }>

    beforeEach(async () => {
      // wearableDefinitionsFetcher resolves URNs through the content client.
      components.content.fetchEntitiesByPointers = jest
        .fn()
        .mockImplementation(async (urns: string[]) => urns.map((urn) => buildWearableEntity(urn, `def-${urn}`)))
      address = generateRandomAddress()
      response = await components.localFetch.fetch(
        `/collections/wearables-by-owner/${address}?includeDefinitions`
      )
      body = (await response.json()) as typeof body
    })

    it('should respond 200', () => {
      expect(response.status).toBe(200)
    })

    it('should attach a definition object resolved from the content client to each entry', () => {
      expect(body).toHaveLength(3)
      for (const entry of body) {
        expect(entry).toMatchObject({
          urn: expect.any(String),
          amount: expect.any(Number),
          definition: expect.objectContaining({ id: entry.urn, name: `def-${entry.urn}` })
        })
      }
    })
  })

  describe('and the owner has more items than the content server pointers limit', () => {
    // Definitions are resolved for every owned item at once, so this path hit the same
    // 400-over-1000-pointers wall as /explorer/:address/wearables and answered 500.
    const CONTENT_SERVER_POINTERS_LIMIT = 1000

    let address: string
    let ownedUrns: string[]
    let requestedPointers: string[][]
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: Array<{ urn: string; definition?: { id: string } }>
    // The definitions cache lives in the components shared by the whole suite, so each test
    // needs its own urns to actually exercise the requests instead of reading them back.
    let run = 0

    beforeEach(async () => {
      run++
      ownedUrns = Array.from(
        { length: CONTENT_SERVER_POINTERS_LIMIT + 1 },
        (_, index) => `urn:by-owner-over-limit:${run}:${index}`
      )
      components.wearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
        elements: ownedUrns.map((urn) => ({ urn, amount: 1, individualData: [{ id: `${urn}:0` }] })),
        totalAmount: ownedUrns.length
      })
      components.content.fetchEntitiesByPointers = jest.fn(async (urns: string[]) => {
        if (urns.length > CONTENT_SERVER_POINTERS_LIMIT) {
          throw new Error(`Invalid JSON body: pointers must NOT have more than ${CONTENT_SERVER_POINTERS_LIMIT} items`)
        }
        return urns.map((urn) => buildWearableEntity(urn, `def-${urn}`))
      })
      address = generateRandomAddress()
      response = await components.localFetch.fetch(`/collections/wearables-by-owner/${address}?includeDefinitions`)
      body = (await response.json()) as typeof body
      requestedPointers = (components.content.fetchEntitiesByPointers as jest.Mock).mock.calls.map((call) => call[0])
    })

    it('should respond 200 instead of failing on the pointers limit', () => {
      expect(response.status).toBe(200)
    })

    it('should keep every content request within the pointers limit', () => {
      expect(requestedPointers.length).toBeGreaterThan(1)
      for (const pointers of requestedPointers) {
        expect(pointers.length).toBeLessThanOrEqual(CONTENT_SERVER_POINTERS_LIMIT)
      }
    })

    it('should resolve a definition for every owned item', () => {
      expect(body).toHaveLength(ownedUrns.length)
      for (const entry of body) {
        expect(entry.definition).toMatchObject({ id: entry.urn })
      }
    })
  })
})
