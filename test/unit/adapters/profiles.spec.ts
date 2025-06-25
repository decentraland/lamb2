import { Snapshots } from '@dcl/schemas'
import {
  isBaseWearable,
  translateWearablesIdFormat,
  roundToSeconds,
  addBaseUrlToSnapshots,
  addBaseUrlToSnapshot
} from '../../../src/adapters/profiles'

// Mock parseUrn
jest.mock('@dcl/urn-resolver', () => ({
  parseUrn: jest.fn()
}))

const { parseUrn } = require('@dcl/urn-resolver')

describe('profiles adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isBaseWearable', () => {
    it('should return true for base-avatars wearables', () => {
      const baseWearable = 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
      expect(isBaseWearable(baseWearable)).toBe(true)
    })

    it('should return false for non-base wearables', () => {
      const onChainWearable = 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
      expect(isBaseWearable(onChainWearable)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isBaseWearable('')).toBe(false)
    })

    it('should return true for any string containing base-avatars', () => {
      expect(isBaseWearable('some-base-avatars-item')).toBe(true)
    })
  })

  describe('translateWearablesIdFormat', () => {
    it('should return original wearable ID if it does not start with dcl://', async () => {
      const wearableId = 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet'
      const result = await translateWearablesIdFormat(wearableId)
      expect(result).toBe(wearableId)
      expect(parseUrn).not.toHaveBeenCalled()
    })

    it('should parse and return URI when wearable ID starts with dcl://', async () => {
      const wearableId = 'dcl://collections-v1/ethermon_wearables/ethermon_feet'
      const mockUri = { toString: () => 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet' }
      parseUrn.mockResolvedValue({ uri: mockUri })

      const result = await translateWearablesIdFormat(wearableId)

      expect(parseUrn).toHaveBeenCalledWith(wearableId)
      expect(result).toBe('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
    })

    it('should return undefined when parseUrn returns null', async () => {
      const wearableId = 'dcl://invalid'
      parseUrn.mockResolvedValue(null)

      const result = await translateWearablesIdFormat(wearableId)

      expect(parseUrn).toHaveBeenCalledWith(wearableId)
      expect(result).toBeUndefined()
    })

    it('should return undefined when parseUrn result has no uri', async () => {
      const wearableId = 'dcl://invalid'
      parseUrn.mockResolvedValue({ uri: null })

      const result = await translateWearablesIdFormat(wearableId)

      expect(parseUrn).toHaveBeenCalledWith(wearableId)
      expect(result).toBeUndefined()
    })
  })

  describe('roundToSeconds', () => {
    it('should round timestamp to seconds', () => {
      const timestamp = 1234567890123 // with milliseconds
      const expected = 1234567890000 // rounded to seconds
      expect(roundToSeconds(timestamp)).toBe(expected)
    })

    it('should handle already rounded timestamps', () => {
      const timestamp = 1234567890000 // already in seconds
      expect(roundToSeconds(timestamp)).toBe(timestamp)
    })

    it('should handle zero', () => {
      expect(roundToSeconds(0)).toBe(0)
    })

    it('should handle negative timestamps', () => {
      const timestamp = -1234567890123
      const expected = -1234567891000 // rounds down (more negative)
      expect(roundToSeconds(timestamp)).toBe(expected)
    })
  })

  describe('addBaseUrlToSnapshot', () => {
    it('should create snapshot URL with base URL ending with slash', () => {
      const entityId = 'test-entity-id'
      const baseUrl = 'https://example.com/'
      const which = 'body'
      const expected = 'https://example.com/entities/test-entity-id/body.png'

      expect(addBaseUrlToSnapshot(entityId, baseUrl, which)).toBe(expected)
    })

    it('should create snapshot URL with base URL not ending with slash', () => {
      const entityId = 'test-entity-id'
      const baseUrl = 'https://example.com'
      const which = 'face'
      const expected = 'https://example.com/entities/test-entity-id/face.png'

      expect(addBaseUrlToSnapshot(entityId, baseUrl, which)).toBe(expected)
    })

    it('should handle empty base URL', () => {
      const entityId = 'test-entity-id'
      const baseUrl = ''
      const which = 'body'
      const expected = '/entities/test-entity-id/body.png'

      expect(addBaseUrlToSnapshot(entityId, baseUrl, which)).toBe(expected)
    })
  })

  describe('addBaseUrlToSnapshots', () => {
    it('should add base URLs to both body and face256 snapshots', () => {
      const entityId = 'test-entity-id'
      const baseUrl = 'https://example.com'
      const snapshots: Snapshots = {
        body: 'original-body',
        face256: 'original-face'
      }

      const result = addBaseUrlToSnapshots(entityId, baseUrl, snapshots)

      expect(result.body).toBe('https://example.com/entities/test-entity-id/body.png')
      expect(result.face256).toBe('https://example.com/entities/test-entity-id/face.png')
      expect(result).toBe(snapshots) // should modify the original object
    })

    it('should work with base URL ending with slash', () => {
      const entityId = 'test-entity-id'
      const baseUrl = 'https://example.com/'
      const snapshots: Snapshots = {
        body: 'original-body',
        face256: 'original-face'
      }

      const result = addBaseUrlToSnapshots(entityId, baseUrl, snapshots)

      expect(result.body).toBe('https://example.com/entities/test-entity-id/body.png')
      expect(result.face256).toBe('https://example.com/entities/test-entity-id/face.png')
    })
  })
})
