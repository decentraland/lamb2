import { createProfilesComponent } from '../../../src/logic/profiles'
import { createDappsDbMock } from '../../mocks/dapps-db-mock'
import { createLogComponent } from '@well-known-components/logger'
import { createConfigComponent } from '@well-known-components/env-config-provider'
import { profileEntityFull, profileEntityTwoEthWearables } from '../../integration/data/profiles-responses'

describe('profiles logic component', () => {
  let components: any
  let profilesComponent: any

  beforeEach(async () => {
    const config = createConfigComponent({
      LOG_LEVEL: 'DEBUG',
      ENSURE_ERC_721: 'true',
      PROFILE_CDN_BASE_URL: 'https://profile-images.decentraland.org'
    })
    const logs = await createLogComponent({ config })
    const dappsDb = createDappsDbMock()

    // Create proper cache mocks that return Map objects as expected by the cache logic
    const createMockCache = () => ({
      get: jest.fn().mockReturnValue(new Map()), // Return empty Map instead of undefined
      set: jest.fn().mockResolvedValue(undefined),
      has: jest.fn().mockReturnValue(false) // Always return false so items go to check instead of cache
    })

    // Create minimal components for profiles component
    components = {
      logs,
      dappsDb,
      config,
      content: { fetchEntitiesByPointers: jest.fn() },
      alchemyNftFetcher: { getNFTsForOwner: jest.fn().mockResolvedValue([]) },
      entitiesFetcher: { fetchEntities: jest.fn() },
      theGraph: {},
      fetch: { fetch: jest.fn() },
      ownershipCaches: {
        l1: createMockCache(),
        l2: createMockCache(),
        tpwCache: createMockCache()
      },
      l1ThirdPartyItemChecker: {
        checkNFTsOwnership: jest.fn().mockResolvedValue({}),
        checkThirdPartyItems: jest.fn().mockResolvedValue([])
      },
      l2ThirdPartyItemChecker: {
        checkNFTsOwnership: jest.fn().mockResolvedValue({}),
        checkThirdPartyItems: jest.fn().mockResolvedValue([])
      },
      thirdPartyProvidersStorage: { getAll: jest.fn().mockResolvedValue([]) },
      contentServerUrl: 'https://test.com',
      metrics: { increment: jest.fn(), decrement: jest.fn(), observe: jest.fn() }
    }
    profilesComponent = await createProfilesComponent(components)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should return profile with owned wearables when user owns everything', async () => {
      const address = '0x1'
      const profileEntity = { ...profileEntityFull }

      // Mock content server response
      components.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])

      // Mock owned items
      const mockWearables = [
        { urn: 'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7', tokenId: '1' },
        { urn: 'urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1', tokenId: '1' },
        { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet', tokenId: '1' },
        { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand', tokenId: '1' }
      ]
      const mockEmotes: any[] = []
      const mockNames = [{ name: 'cryptonico' }]

      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue(mockWearables)
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue(mockEmotes)
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue(mockNames)

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeDefined()
      expect(result.avatars).toHaveLength(1)
      expect(result.avatars[0].hasClaimedName).toBe(true)
      expect(result.avatars[0].name).toBe('cryptonico')
      expect(result.avatars[0].ethAddress).toBe(address)

      // Should include base wearables + owned wearables with token IDs
      const wearables = result.avatars[0].avatar.wearables
      expect(wearables).toContain('urn:decentraland:off-chain:base-avatars:eyebrows_00')
      expect(wearables).toContain('urn:decentraland:off-chain:base-avatars:short_hair')
      expect(wearables).toContain(
        'urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7:1'
      )
      expect(wearables).toContain('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:1')
    })

    it('should filter out non-owned wearables', async () => {
      const address = '0x2'
      const profileEntity = { ...profileEntityTwoEthWearables }

      components.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])

      // Mock only owning one of the two wearables
      const mockWearables = [
        { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet', tokenId: '1' }
        // Missing: ethermon_hand (not owned)
      ]
      const mockEmotes: any[] = []
      const mockNames: any[] = [] // No names owned

      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue(mockWearables)
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue(mockEmotes)
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue(mockNames)

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeDefined()
      expect(result.avatars).toHaveLength(1)
      expect(result.avatars[0].hasClaimedName).toBe(false)

      const wearables = result.avatars[0].avatar.wearables
      expect(wearables).toContain('urn:decentraland:off-chain:base-avatars:eyebrows_00')
      expect(wearables).toContain('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:1')
      expect(wearables).not.toContain('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand:1')
    })

    it('should handle profiles with emotes correctly', async () => {
      const address = '0x3'
      const profileWithEmotes = {
        ...profileEntityFull,
        pointers: [address],
        metadata: {
          avatars: [
            {
              ...profileEntityFull.metadata.avatars[0],
              ethAddress: address,
              avatar: {
                ...profileEntityFull.metadata.avatars[0].avatar,
                emotes: [
                  { slot: 1, urn: 'urn:decentraland:matic:collections-v2:0xemote123:0:1' },
                  { slot: 2, urn: 'urn:decentraland:ethereum:collections-v1:emote_collection:dance_emote:2' }
                ]
              }
            }
          ]
        }
      }

      components.content.fetchEntitiesByPointers.mockResolvedValue([profileWithEmotes])

      const mockWearables: any[] = []
      const mockEmotes = [
        { urn: 'urn:decentraland:matic:collections-v2:0xemote123:0', tokenId: '1' },
        { urn: 'urn:decentraland:ethereum:collections-v1:emote_collection:dance_emote', tokenId: '2' }
      ]
      const mockNames: any[] = []

      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue(mockWearables)
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue(mockEmotes)
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue(mockNames)

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeDefined()
      expect(result.avatars[0].avatar.emotes).toHaveLength(2)
      expect(result.avatars[0].avatar.emotes[0]).toEqual({
        slot: 1,
        urn: 'urn:decentraland:matic:collections-v2:0xemote123:0:1'
      })
      expect(result.avatars[0].avatar.emotes[1]).toEqual({
        slot: 2,
        urn: 'urn:decentraland:ethereum:collections-v1:emote_collection:dance_emote:2'
      })
    })

    it('should return undefined when profile entity is not found', async () => {
      const address = '0x999'

      components.content.fetchEntitiesByPointers.mockResolvedValue([])

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeUndefined()
    })

    it('should handle default profiles correctly', async () => {
      const address = 'default123'
      const defaultProfile = {
        ...profileEntityFull,
        pointers: [address],
        metadata: {
          avatars: [
            {
              ...profileEntityFull.metadata.avatars[0],
              ethAddress: address
            }
          ]
        }
      }

      components.content.fetchEntitiesByPointers.mockResolvedValue([defaultProfile])

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeDefined()
      // For default profiles, no ownership checks should be made
      expect(components.dappsDb.getOwnedWearablesUrnAndTokenId).not.toHaveBeenCalled()
      expect(components.dappsDb.getOwnedEmotesUrnAndTokenId).not.toHaveBeenCalled()
      expect(components.dappsDb.getOwnedNamesOnly).not.toHaveBeenCalled()
    })

    it('should add base URL to snapshots correctly', async () => {
      const address = '0x1'
      const profileEntity = { ...profileEntityFull }

      components.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])
      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue([])

      const result = await profilesComponent.getProfile(address)

      expect(result).toBeDefined()
      const snapshots = result.avatars[0].avatar.snapshots
      expect(snapshots.body).toBe(`https://profile-images.decentraland.org/entities/${profileEntity.id}/body.png`)
      expect(snapshots.face256).toBe(`https://profile-images.decentraland.org/entities/${profileEntity.id}/face.png`)
    })
  })

  describe('getProfiles', () => {
    it('should return multiple profiles when provided multiple addresses', async () => {
      const addresses = ['0x1', '0x2']
      const profileEntities = [
        { ...profileEntityFull, pointers: ['0x1'] },
        { ...profileEntityTwoEthWearables, pointers: ['0x2'] }
      ]

      components.content.fetchEntitiesByPointers.mockResolvedValue(profileEntities)
      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue([])

      const result = await profilesComponent.getProfiles(addresses)

      expect(result).toHaveLength(2)
      expect(result[0].avatars[0].ethAddress).toBe('0x1')
      expect(result[1].avatars[0].ethAddress).toBe('0x3') // From profileEntityTwoEthWearables
    })

    it('should return undefined when ifModifiedSinceTimestamp is more recent than profiles', async () => {
      const addresses = ['0x1']
      const profileEntity = { ...profileEntityFull, timestamp: 1000 }

      components.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])

      const result = await profilesComponent.getProfiles(addresses, 2000) // More recent timestamp

      expect(result).toBeUndefined()
    })

    it('should filter out profiles without metadata', async () => {
      const addresses = ['0x1', '0x2']
      const profileEntities = [
        { ...profileEntityFull, pointers: ['0x1'] },
        { ...profileEntityFull, pointers: ['0x2'], metadata: null } // No metadata
      ]

      components.content.fetchEntitiesByPointers.mockResolvedValue(profileEntities)
      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue([])

      const result = await profilesComponent.getProfiles(addresses)

      expect(result).toHaveLength(1)
      expect(result[0].avatars[0].ethAddress).toBe('0x1')
    })
  })

  describe('error handling', () => {
    it('should return empty array when content fetching throws error', async () => {
      const address = '0x1'

      components.content.fetchEntitiesByPointers.mockRejectedValue(new Error('Content fetch failed'))

      const result = await profilesComponent.getProfiles([address])

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const address = '0x1'
      const profileEntity = { ...profileEntityFull }

      components.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])
      components.dappsDb.getOwnedWearablesUrnAndTokenId.mockRejectedValue(new Error('DB error'))
      components.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue([])
      components.dappsDb.getOwnedNamesOnly.mockResolvedValue([])

      const result = await profilesComponent.getProfiles([address])

      expect(result).toEqual([])
    })
  })

  describe('ERC-721 configuration', () => {
    it('should respect ENSURE_ERC_721=false configuration', async () => {
      // Create new component with ERC-721 disabled
      const config = createConfigComponent({
        LOG_LEVEL: 'DEBUG',
        ENSURE_ERC_721: 'false',
        PROFILE_CDN_BASE_URL: 'https://profile-images.decentraland.org'
      })
      const logs = await createLogComponent({ config })
      const componentsWithoutERC721 = {
        ...components,
        config,
        logs
      }
      const profilesComponentNoERC721 = await createProfilesComponent(componentsWithoutERC721)

      const address = '0x1'
      const profileEntity = { ...profileEntityFull }

      componentsWithoutERC721.content.fetchEntitiesByPointers.mockResolvedValue([profileEntity])
      const mockWearables = [
        { urn: 'urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet', tokenId: '1' }
      ]
      componentsWithoutERC721.dappsDb.getOwnedWearablesUrnAndTokenId.mockResolvedValue(mockWearables)
      componentsWithoutERC721.dappsDb.getOwnedEmotesUrnAndTokenId.mockResolvedValue([])
      componentsWithoutERC721.dappsDb.getOwnedNamesOnly.mockResolvedValue([])

      const result = await profilesComponentNoERC721.getProfile(address)

      expect(result).toBeDefined()
      const wearables = result.avatars[0].avatar.wearables
      // Should NOT include token ID when ENSURE_ERC_721 is false
      expect(wearables).toContain('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet')
      expect(wearables).not.toContain('urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet:1')
    })
  })
})
