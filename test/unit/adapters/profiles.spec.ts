import { Entity } from '@dcl/schemas'
import { createProfilesComponent, IProfilesComponent } from '../../../src/adapters/profiles'
import { createOwnershipCachesComponent } from '../../../src/ports/ownership-caches'
import { ProfileMetadata } from '../../../src/types'

const THIRD_PARTY_WEARABLE =
  'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'

function profileEntity(address: string, wearables: string[]): Entity {
  return {
    version: 'v3',
    id: `entity-${address}`,
    type: 'profile',
    pointers: [address],
    timestamp: 1,
    content: [],
    metadata: {
      avatars: [
        {
          hasClaimedName: false,
          name: address,
          userId: address,
          ethAddress: address,
          avatar: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            wearables,
            emotes: [],
            snapshots: { face256: '', body: '' }
          }
        }
      ]
    }
  } as unknown as Entity
}

describe('when fetching a batch of profiles', () => {
  let profiles: IProfilesComponent
  let content: { fetchEntitiesByPointers: jest.Mock }
  let l1ThirdPartyItemChecker: { checkThirdPartyItems: jest.Mock }
  let l2ThirdPartyItemChecker: { checkThirdPartyItems: jest.Mock }
  let addresses: string[]
  let result: ProfileMetadata[] | undefined

  beforeEach(async () => {
    const nothingOwned = () => ({ fetchOwnedElements: jest.fn().mockResolvedValue({ elements: [], totalAmount: 0 }) })
    const config = {
      getString: jest.fn().mockResolvedValue(undefined),
      getNumber: jest.fn().mockResolvedValue(undefined)
    }
    content = { fetchEntitiesByPointers: jest.fn() }
    l1ThirdPartyItemChecker = { checkThirdPartyItems: jest.fn().mockResolvedValue([]) }
    l2ThirdPartyItemChecker = { checkThirdPartyItems: jest.fn().mockResolvedValue([]) }

    profiles = await createProfilesComponent({
      content,
      config,
      logs: {
        getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() })
      },
      ownershipCaches: await createOwnershipCachesComponent({ config } as any),
      l1ThirdPartyItemChecker,
      l2ThirdPartyItemChecker,
      wearablesFetcher: nothingOwned(),
      emotesFetcher: nothingOwned(),
      namesFetcher: nothingOwned()
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and every profile wears a third-party wearable', () => {
    beforeEach(async () => {
      addresses = ['0x1', '0x2', '0x3']
      content.fetchEntitiesByPointers.mockResolvedValue(
        addresses.map((address) => profileEntity(address, [THIRD_PARTY_WEARABLE]))
      )
      result = await profiles.getProfiles(addresses)
    })

    it('should resolve third-party ownership once per address rather than once per profile per address', () => {
      expect(l2ThirdPartyItemChecker.checkThirdPartyItems).toHaveBeenCalledTimes(addresses.length)
    })

    it('should check each address only against its own third-party wearables', () => {
      expect(l2ThirdPartyItemChecker.checkThirdPartyItems.mock.calls.map(([address]) => address)).toEqual(addresses)
    })

    it('should keep the owned third-party wearable on every profile', () => {
      expect(result?.map((profile) => profile.avatars[0].avatar.wearables)).toEqual(
        addresses.map(() => [THIRD_PARTY_WEARABLE])
      )
    })
  })

  describe('and every profile in the batch is a default profile', () => {
    beforeEach(async () => {
      addresses = ['default1', 'default2']
      content.fetchEntitiesByPointers.mockResolvedValue(
        addresses.map((address) => profileEntity(address, [THIRD_PARTY_WEARABLE]))
      )
      result = await profiles.getProfiles(addresses)
    })

    it('should not check third-party ownership at all', () => {
      expect(l2ThirdPartyItemChecker.checkThirdPartyItems).not.toHaveBeenCalled()
    })

    it('should still return one profile per address', () => {
      expect(result).toHaveLength(addresses.length)
    })
  })
})
