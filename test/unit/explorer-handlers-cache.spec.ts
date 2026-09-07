import { explorerHandler } from '../../src/controllers/handlers/explorer-handler'
import { explorerEmotesHandler } from '../../src/controllers/handlers/explorer-emotes-handler'
import { EXPLORER_CACHE_OPTIONS, PAGINATION_DEFAULTS } from '../../src/logic/pagination-constants'

/**
 * The /explorer/* routes are the signed-in user's own backpack, and they share their fetchers with
 * /users/:address/* — so the short TTL cannot live on the component, it has to be asked for per call.
 * These assert the wiring: without it the constant exists and nothing uses it, which is exactly the
 * state that shipped the bug.
 */

const emptyFetcher = () => ({ fetchOwnedElements: jest.fn().mockResolvedValue({ elements: [], totalAmount: 0 }) })

describe('explorer handlers cache TTL wiring', () => {
  it('asks the wearables fetcher for the short TTL', async () => {
    const wearablesFetcher = emptyFetcher()
    const components = {
      fetch: { fetch: jest.fn() },
      baseWearablesFetcher: emptyFetcher(),
      wearablesFetcher,
      thirdPartyWearablesFetcher: emptyFetcher(),
      entitiesFetcher: { fetchEntities: jest.fn().mockResolvedValue([]) },
      thirdPartyProvidersStorage: { getAll: jest.fn().mockResolvedValue([]) }
    }

    await explorerHandler({
      params: { address: '0xsomeone' },
      url: new URL('https://peer.decentraland.org/lambdas/explorer/0xsomeone/wearables'),
      components
    } as any)

    expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(
      '0xsomeone',
      undefined,
      expect.anything(),
      EXPLORER_CACHE_OPTIONS
    )
    // Third-party wearables ride in the same response, so a linked wearable must not lag behind.
    expect(components.thirdPartyWearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(
      '0xsomeone',
      undefined,
      undefined,
      EXPLORER_CACHE_OPTIONS
    )
  })

  it('asks the emotes fetcher for the short TTL', async () => {
    const emotesFetcher = emptyFetcher()
    const components = {
      emotesFetcher,
      entitiesFetcher: { fetchEntities: jest.fn().mockResolvedValue([]) }
    }

    await explorerEmotesHandler({
      params: { address: '0xsomeone' },
      url: new URL('https://peer.decentraland.org/lambdas/explorer/0xsomeone/emotes'),
      components
    } as any)

    expect(emotesFetcher.fetchOwnedElements).toHaveBeenCalledWith(
      '0xsomeone',
      undefined,
      undefined,
      EXPLORER_CACHE_OPTIONS
    )
  })
})

describe('explorer cache options', () => {
  it('stay short enough, and stale-tolerant, for a change to your own items to show up', () => {
    // Guards the shape of the fix rather than a literal: minutes would reintroduce the bug, and without
    // serveStale every expiry would cost the backpack a full multi-page inventory fetch before it opens.
    expect(EXPLORER_CACHE_OPTIONS.ttl).toBeLessThanOrEqual(30_000)
    expect(EXPLORER_CACHE_OPTIONS.ttl).toBeLessThan(PAGINATION_DEFAULTS.CACHE_TTL)
    expect(EXPLORER_CACHE_OPTIONS.serveStale).toBe(true)
  })
})
