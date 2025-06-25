import { createDappsDbComponent } from '../../../../src/ports/dapps-db/component'
import { createPgComponent } from '@well-known-components/pg-component'

// Mock the createPgComponent
jest.mock('@well-known-components/pg-component')

describe('dapps-db component', () => {
  let mockConfig: any
  let mockLogs: any
  let mockMetrics: any
  let mockLogger: any
  let mockPgComponent: any
  let mockClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    }

    mockLogs = {
      getLogger: jest.fn().mockReturnValue(mockLogger)
    }

    mockConfig = {}
    mockMetrics = {}

    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    }

    mockPgComponent = {
      getPool: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(mockClient)
      }),
      start: jest.fn(),
      stop: jest.fn()
    }
    ;(createPgComponent as jest.Mock).mockResolvedValue(mockPgComponent)
  })

  describe('createDappsDbComponent', () => {
    it('should create component successfully', async () => {
      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      expect(component).toBeDefined()
      expect(component.getWearablesByOwner).toBeDefined()
      expect(component.getOwnedWearablesUrnAndTokenId).toBeDefined()
      expect(component.getEmotesByOwner).toBeDefined()
      expect(component.getOwnedEmotesUrnAndTokenId).toBeDefined()
      expect(component.getNamesByOwner).toBeDefined()
      expect(component.getOwnedNamesOnly).toBeDefined()
    })

    it('should extend pg component', async () => {
      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      expect(component.start).toBe(mockPgComponent.start)
      expect(component.stop).toBe(mockPgComponent.stop)
    })
  })

  describe('getWearablesByOwner', () => {
    it('should fetch wearables successfully', async () => {
      const mockRows = [
        {
          id: 'test-id',
          urn: 'urn:decentraland:ethereum:collections-v1:test:item',
          token_id: '123',
          owner: '0xowner',
          category: 'upper_body',
          name: 'Test Wearable',
          rarity: 'common'
        }
      ]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getWearablesByOwner('0xowner')

      expect(mockClient.query).toHaveBeenCalled()
      expect(mockClient.release).toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 1 wearables for owner 0xowner')
      expect(result).toHaveLength(1)
    })

    it('should handle database errors and release client', async () => {
      const dbError = new Error('Database connection failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getWearablesByOwner('0xowner')).rejects.toThrow('Database connection failed')

      expect(mockClient.release).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching wearables by owner', {
        owner: '0xowner',
        error: 'Database connection failed'
      })
    })

    it('should handle non-Error exceptions', async () => {
      const stringError = 'String error'
      mockClient.query.mockRejectedValue(stringError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getWearablesByOwner('0xowner')).rejects.toBe(stringError)

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching wearables by owner', {
        owner: '0xowner',
        error: 'String error'
      })
    })
  })

  describe('getOwnedWearablesUrnAndTokenId', () => {
    it('should fetch wearable URNs and token IDs successfully', async () => {
      const mockRows = [{ urn: 'urn:decentraland:ethereum:collections-v1:test:item', token_id: '123' }]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getOwnedWearablesUrnAndTokenId('0xowner')

      expect(result).toEqual([{ urn: 'urn:decentraland:ethereum:collections-v1:test:item', tokenId: '123' }])
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 1 wearables (URN+tokenId) for owner 0xowner')
    })

    it('should handle errors in getOwnedWearablesUrnAndTokenId', async () => {
      const dbError = new Error('Query failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getOwnedWearablesUrnAndTokenId('0xowner')).rejects.toThrow('Query failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching wearables URN and token ID by owner', {
        owner: '0xowner',
        error: 'Query failed'
      })
    })
  })

  describe('getEmotesByOwner', () => {
    it('should fetch emotes successfully', async () => {
      const mockRows = [
        {
          id: 'test-emote-id',
          urn: 'urn:decentraland:ethereum:collections-v1:test:emote',
          token_id: '456',
          owner: '0xowner',
          category: 'dance',
          name: 'Test Emote'
        }
      ]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getEmotesByOwner('0xowner')

      expect(result).toHaveLength(1)
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 1 emotes for owner 0xowner')
    })

    it('should handle errors in getEmotesByOwner', async () => {
      const dbError = new Error('Emote query failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getEmotesByOwner('0xowner')).rejects.toThrow('Emote query failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching emotes by owner', {
        owner: '0xowner',
        error: 'Emote query failed'
      })
    })
  })

  describe('getOwnedEmotesUrnAndTokenId', () => {
    it('should fetch emote URNs and token IDs successfully', async () => {
      const mockRows = [{ urn: 'urn:decentraland:ethereum:collections-v1:test:emote', token_id: '456' }]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getOwnedEmotesUrnAndTokenId('0xowner')

      expect(result).toEqual([{ urn: 'urn:decentraland:ethereum:collections-v1:test:emote', tokenId: '456' }])
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 1 emotes (URN+tokenId) for owner 0xowner')
    })

    it('should handle errors in getOwnedEmotesUrnAndTokenId', async () => {
      const dbError = new Error('Emote URN query failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getOwnedEmotesUrnAndTokenId('0xowner')).rejects.toThrow('Emote URN query failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching emotes URN and token ID by owner', {
        owner: '0xowner',
        error: 'Emote URN query failed'
      })
    })
  })

  describe('getNamesByOwner', () => {
    it('should fetch names successfully', async () => {
      const mockRows = [
        {
          id: 'test-name-id',
          name: 'testname',
          token_id: '789',
          contract_address: '0xcontract',
          price: 100
        }
      ]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getNamesByOwner('0xowner')

      expect(result).toHaveLength(1)
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 1 names for owner 0xowner')
    })

    it('should handle errors in getNamesByOwner', async () => {
      const dbError = new Error('Name query failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getNamesByOwner('0xowner')).rejects.toThrow('Name query failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching names by owner', {
        owner: '0xowner',
        error: 'Name query failed'
      })
    })
  })

  describe('getOwnedNamesOnly', () => {
    it('should fetch name strings successfully', async () => {
      const mockRows = [{ name: 'testname1' }, { name: 'testname2' }]

      mockClient.query.mockResolvedValue({ rows: mockRows })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      const result = await component.getOwnedNamesOnly('0xowner')

      expect(result).toEqual([{ name: 'testname1' }, { name: 'testname2' }])
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 2 names (name only) for owner 0xowner')
    })

    it('should handle errors in getOwnedNamesOnly', async () => {
      const dbError = new Error('Names only query failed')
      mockClient.query.mockRejectedValue(dbError)

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getOwnedNamesOnly('0xowner')).rejects.toThrow('Names only query failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching names only by owner', {
        owner: '0xowner',
        error: 'Names only query failed'
      })
    })
  })

  describe('client connection errors', () => {
    it('should handle connection pool errors', async () => {
      const connectionError = new Error('Connection pool exhausted')
      mockPgComponent.getPool.mockReturnValue({
        connect: jest.fn().mockRejectedValue(connectionError)
      })

      const component = await createDappsDbComponent({
        config: mockConfig,
        logs: mockLogs,
        metrics: mockMetrics
      })

      await expect(component.getWearablesByOwner('0xowner')).rejects.toThrow('Connection pool exhausted')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching wearables by owner', {
        owner: '0xowner',
        error: 'Connection pool exhausted'
      })
    })
  })
})
