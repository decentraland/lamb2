import { IDappsDbComponent } from '../../../src/ports/dapps-db'
import { createDappsDbMock } from '../../mocks/dapps-db-mock'

describe('dapps-db component', () => {
  let dappsDb: IDappsDbComponent

  beforeEach(() => {
    dappsDb = createDappsDbMock()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getWearablesByOwner', () => {
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getWearablesByOwner').mockResolvedValue([])
    })

    it('should return empty array when no wearables found', async () => {
      const result = await dappsDb.getWearablesByOwner('0x123')
      expect(result).toEqual([])
      expect(dappsDb.getWearablesByOwner).toHaveBeenCalledWith('0x123')
    })

    it('should handle limit parameter', async () => {
      await dappsDb.getWearablesByOwner('0x123', 50)
      expect(dappsDb.getWearablesByOwner).toHaveBeenCalledWith('0x123', 50)
    })
  })

  describe('getEmotesByOwner', () => {
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getEmotesByOwner').mockResolvedValue([])
    })
    it('should return empty array when no emotes found', async () => {
      const result = await dappsDb.getEmotesByOwner('0x123')
      expect(result).toEqual([])
      expect(dappsDb.getEmotesByOwner).toHaveBeenCalledWith('0x123')
    })
  })

  describe('getNamesByOwner', () => {
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getNamesByOwner').mockResolvedValue([])
    })
    it('should return empty array when no names found', async () => {
      const result = await dappsDb.getNamesByOwner('0x123')
      expect(result).toEqual([])
      expect(dappsDb.getNamesByOwner).toHaveBeenCalledWith('0x123')
    })
  })

  describe('getOwnedWearablesUrnAndTokenId', () => {
    const mockData = [{ urn: 'urn:test', tokenId: '123' }]
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getOwnedWearablesUrnAndTokenId').mockResolvedValue(mockData)
    })
    it('should return minimal wearable data for profiles', async () => {
      const result = await dappsDb.getOwnedWearablesUrnAndTokenId('0x123')

      expect(result).toEqual(mockData)
      expect(dappsDb.getOwnedWearablesUrnAndTokenId).toHaveBeenCalledWith('0x123')
    })
  })

  describe('getOwnedEmotesUrnAndTokenId', () => {
    const mockData = [{ urn: 'urn:test', tokenId: '456' }]
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getOwnedEmotesUrnAndTokenId').mockResolvedValue(mockData)
    })
    it('should return minimal emote data for profiles', async () => {
      const result = await dappsDb.getOwnedEmotesUrnAndTokenId('0x123')
      expect(result).toEqual(mockData)
      expect(dappsDb.getOwnedEmotesUrnAndTokenId).toHaveBeenCalledWith('0x123')
    })
  })

  describe('getOwnedNamesOnly', () => {
    const mockData = [{ name: 'testname' }]
    beforeEach(() => {
      jest.spyOn(dappsDb, 'getOwnedNamesOnly').mockResolvedValue(mockData)
    })
    it('should return only name field for profiles', async () => {
      const result = await dappsDb.getOwnedNamesOnly('0x123')
      expect(result).toEqual(mockData)
      expect(dappsDb.getOwnedNamesOnly).toHaveBeenCalledWith('0x123')
    })
  })
})
