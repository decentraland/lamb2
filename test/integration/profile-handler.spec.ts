import { test } from '../components'
import { generateRandomAddress } from '../helpers'
import { ProfileMetadata } from '../../src/types'

test('profile-handler: GET /profiles/:id should', function ({ components }) {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('return profile with base wearables when no items are owned', async () => {
    const { localFetch } = components
    const address = generateRandomAddress()

    // Mock a basic profile response
    const mockProfile: ProfileMetadata = {
      timestamp: Date.now(),
      avatars: [
        {
          hasClaimedName: false,
          name: '',
          userId: address,
          description: '',
          ethAddress: address,
          version: 1,
          tutorialStep: 0,
          avatar: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            emotes: [],
            wearables: [
              'urn:decentraland:off-chain:base-avatars:BaseMale',
              'urn:decentraland:off-chain:base-avatars:hair'
            ],
            snapshots: {
              body: 'https://peer.decentraland.org/content/entities/test/body.png',
              face256: 'https://peer.decentraland.org/content/entities/test/face.png'
            },
            eyes: {
              color: { r: 0.37, g: 0.22, b: 0.19 }
            },
            hair: {
              color: { r: 0.23, g: 0.12, b: 0.04 }
            },
            skin: {
              color: { r: 0.94, g: 0.76, b: 0.64 }
            }
          }
        }
      ]
    }

    // Mock the profiles component to return our mock profile
    jest.spyOn(components.profiles, 'getProfile').mockResolvedValue(mockProfile)

    const response = await localFetch.fetch(`/profiles/${address}`)

    expect(response.status).toBe(200)
    const profile = await response.json()

    // Should return a Profile object with avatar containing wearables
    expect(profile).toHaveProperty('avatars')
    expect(Array.isArray(profile.avatars)).toBe(true)
    expect(profile.avatars.length).toBe(1)
    expect(profile.avatars[0]).toHaveProperty('avatar')
    expect(profile.avatars[0].avatar).toHaveProperty('wearables')
    expect(Array.isArray(profile.avatars[0].avatar.wearables)).toBe(true)
    // Base wearables should be included
    expect(profile.avatars[0].avatar.wearables.length).toBeGreaterThan(0)
    expect(profile.avatars[0].avatar.wearables).toContain('urn:decentraland:off-chain:base-avatars:BaseMale')
  })

  it('return profile with owned wearables and emotes', async () => {
    const { localFetch } = components
    const address = generateRandomAddress()

    // Mock a profile with owned items
    const mockProfile: ProfileMetadata = {
      timestamp: Date.now(),
      avatars: [
        {
          hasClaimedName: true,
          name: 'testname',
          userId: address,
          description: '',
          ethAddress: address,
          version: 1,
          tutorialStep: 0,
          avatar: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            emotes: [{ slot: 0, urn: 'urn:decentraland:matic:collections-v2:0xemote:0:789' }],
            wearables: [
              'urn:decentraland:off-chain:base-avatars:BaseFemale',
              'urn:decentraland:matic:collections-v2:0xcontract:0:123',
              'urn:decentraland:ethereum:collections-v1:collection:item:456'
            ],
            snapshots: {
              body: 'https://peer.decentraland.org/content/entities/test/body.png',
              face256: 'https://peer.decentraland.org/content/entities/test/face.png'
            },
            eyes: {
              color: { r: 0.37, g: 0.22, b: 0.19 }
            },
            hair: {
              color: { r: 0.23, g: 0.12, b: 0.04 }
            },
            skin: {
              color: { r: 0.94, g: 0.76, b: 0.64 }
            }
          }
        }
      ]
    }

    jest.spyOn(components.profiles, 'getProfile').mockResolvedValue(mockProfile)

    const response = await localFetch.fetch(`/profiles/${address}`)

    expect(response.status).toBe(200)
    const profile = await response.json()

    expect(profile).toHaveProperty('avatars')
    expect(Array.isArray(profile.avatars)).toBe(true)
    expect(profile.avatars.length).toBe(1)
    expect(profile.avatars[0]).toHaveProperty('avatar')
    expect(profile.avatars[0].avatar).toHaveProperty('wearables')
    expect(profile.avatars[0].avatar).toHaveProperty('emotes')

    // Should include owned wearables and base wearables
    expect(profile.avatars[0].avatar.wearables.length).toBe(3)
    expect(profile.avatars[0].avatar.wearables).toContain('urn:decentraland:matic:collections-v2:0xcontract:0:123')
    expect(profile.avatars[0].avatar.emotes.length).toBe(1)
    expect(profile.avatars[0].avatar.emotes[0].urn).toBe('urn:decentraland:matic:collections-v2:0xemote:0:789')
  })

  describe('when profile not found', () => {
    beforeEach(() => {
      // Mock no profile found
      jest.spyOn(components.profiles, 'getProfile').mockResolvedValue(undefined)
    })

    it('return 404 when profile not found', async () => {
      const { localFetch } = components
      const address = generateRandomAddress()

      const response = await localFetch.fetch(`/profiles/${address}`)

      expect(response.status).toBe(404)
    })
  })

  describe('when invalid address format', () => {
    beforeEach(() => {
      jest.spyOn(components.profiles, 'getProfile').mockResolvedValue(undefined)
    })

    it('return 404 for invalid address format', async () => {
      const { localFetch } = components

      const response = await localFetch.fetch('/profiles/invalid-address-format')
      expect(response.status).toBe(404)
    })
  })
})

test('profile-handler: POST /profiles should', function ({ components }) {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when requesting batch', () => {
    let address1: string
    let address2: string

    beforeEach(() => {
      // Mock multiple profiles response
      const mockProfiles: ProfileMetadata[] = [
        {
          timestamp: Date.now(),
          avatars: [
            {
              hasClaimedName: false,
              name: '',
              userId: address1,
              description: '',
              ethAddress: address1,
              version: 1,
              tutorialStep: 0,
              avatar: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
                emotes: [],
                wearables: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                snapshots: {
                  body: 'https://peer.decentraland.org/content/entities/test1/body.png',
                  face256: 'https://peer.decentraland.org/content/entities/test1/face.png'
                },
                eyes: {
                  color: { r: 0.37, g: 0.22, b: 0.19 }
                },
                hair: {
                  color: { r: 0.23, g: 0.12, b: 0.04 }
                },
                skin: {
                  color: { r: 0.94, g: 0.76, b: 0.64 }
                }
              }
            }
          ]
        },
        {
          timestamp: Date.now(),
          avatars: [
            {
              hasClaimedName: false,
              name: '',
              userId: address2,
              description: '',
              ethAddress: address2,
              version: 1,
              tutorialStep: 0,
              avatar: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
                emotes: [],
                wearables: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                snapshots: {
                  body: 'https://peer.decentraland.org/content/entities/test2/body.png',
                  face256: 'https://peer.decentraland.org/content/entities/test2/face.png'
                },
                eyes: {
                  color: { r: 0.37, g: 0.22, b: 0.19 }
                },
                hair: {
                  color: { r: 0.23, g: 0.12, b: 0.04 }
                },
                skin: {
                  color: { r: 0.94, g: 0.76, b: 0.64 }
                }
              }
            }
          ]
        }
      ]
      jest.spyOn(components.profiles, 'getProfiles').mockResolvedValue(mockProfiles)
      address1 = generateRandomAddress()
      address2 = generateRandomAddress()
    })

    it('return multiple profiles when requesting batch', async () => {
      const { localFetch } = components

      const response = await localFetch.fetch('/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [address1, address2]
        })
      })

      expect(response.status).toBe(200)
      const profiles = await response.json()

      // Should return array of Profile objects
      expect(Array.isArray(profiles)).toBe(true)
      expect(profiles.length).toBe(2)

      // Both profiles should have avatars with wearables
      profiles.forEach((profile: any) => {
        expect(profile).toHaveProperty('avatars')
        expect(Array.isArray(profile.avatars)).toBe(true)
        expect(profile.avatars[0]).toHaveProperty('avatar')
        expect(profile.avatars[0].avatar).toHaveProperty('wearables')
      })
    })
  })

  describe('when requesting batch with invalid request body', () => {
    it('return 400 for invalid request body', async () => {
      const { localFetch } = components

      const response = await localFetch.fetch('/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'body' })
      })

      expect(response.status).toBe(400)
    })
  })
})
