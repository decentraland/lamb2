import { EmoteCategory, Rarity, WearableCategory } from '@dcl/schemas'
import { IDappsDbComponent, ProfileWearable, ProfileEmote, ProfileName } from '../../src/ports/dapps-db'

/**
 * Creates a mock implementation of IDappsDbComponent for testing
 * Provides configurable mock responses for all dappsDb methods
 */
export function createDappsDbMock(): IDappsDbComponent {
  const mock: Partial<IDappsDbComponent> = {
    getWearablesByOwner: jest.fn().mockResolvedValue([]),
    getEmotesByOwner: jest.fn().mockResolvedValue([]),
    getNamesByOwner: jest.fn().mockResolvedValue([]),

    getOwnedWearablesUrnAndTokenId: jest.fn().mockResolvedValue([]),
    getOwnedEmotesUrnAndTokenId: jest.fn().mockResolvedValue([]),
    getOwnedNamesOnly: jest.fn().mockResolvedValue([]),

    // PostgreSQL pool methods (inherited from IPgComponent)
    getPool: jest.fn(),
    query: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  }

  return mock as IDappsDbComponent
}

/**
 * Helper to create profile wearable test data
 */
export function createMockProfileWearable(overrides: Partial<ProfileWearable> = {}): ProfileWearable {
  return {
    urn: 'urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0',
    id: 'wearable-id-1',
    tokenId: '123',
    category: WearableCategory.UPPER_BODY,
    transferredAt: Date.now(),
    name: 'Test Wearable',
    rarity: Rarity.COMMON,
    price: 100,
    individualData: [
      {
        id: 'data-id-1',
        tokenId: '123',
        transferredAt: Date.now(),
        price: 100
      }
    ],
    amount: 1,
    minTransferredAt: Date.now(),
    maxTransferredAt: Date.now(),
    ...overrides
  }
}

/**
 * Helper to create profile emote test data
 */
export function createMockProfileEmote(overrides: Partial<ProfileEmote> = {}): ProfileEmote {
  return {
    urn: 'urn:decentraland:matic:collections-v2:0xemote123:0',
    id: 'emote-id-1',
    tokenId: '456',
    category: EmoteCategory.DANCE,
    transferredAt: Date.now(),
    name: 'Test Emote',
    rarity: Rarity.RARE,
    price: 200,
    individualData: [
      {
        id: 'emote-data-id-1',
        tokenId: '456',
        transferredAt: Date.now(),
        price: 200
      }
    ],
    amount: 1,
    minTransferredAt: Date.now(),
    maxTransferredAt: Date.now(),
    ...overrides
  }
}

/**
 * Helper to create profile name test data
 */
export function createMockProfileName(overrides: Partial<ProfileName> = {}): ProfileName {
  return {
    name: 'testname',
    contractAddress: '0x2a187453064356c898cae034eaed119e1663acb8',
    tokenId: '789',
    price: 300,
    ...overrides
  }
}
