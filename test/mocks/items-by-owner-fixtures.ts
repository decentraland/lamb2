// Shared fixture builders for the wearables-by-owner and emotes-by-owner handler unit tests.
// Both handlers funnel through getItemsByOwner and need the same third-party / fetch / logs
// component shape; only the owned-fetcher and definitions-fetcher names differ.

export function buildOwnerHandlerSharedComponents() {
  return {
    thirdPartyWearablesFetcher: { fetchOwnedElements: jest.fn() } as any,
    thirdPartyProvidersStorage: { get: jest.fn(), getAll: jest.fn() } as any,
    logs: { getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) } as any,
    fetch: { fetch: jest.fn() } as any
  }
}

export function makeOwnedFetcherMock() {
  return { fetchOwnedElements: jest.fn() }
}

export function makeDefinitionsFetcherMock() {
  return { fetchItemsDefinitions: jest.fn() }
}
