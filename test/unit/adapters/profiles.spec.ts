import { Entity } from '@dcl/schemas'
import { createProfilesComponent, IProfilesComponent } from '../../../src/adapters/profiles'
import { createOwnershipCachesComponent } from '../../../src/ports/ownership-caches'
import { ProfileMetadata } from '../../../src/types'

const THIRD_PARTY_WEARABLE =
  'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f'

type Harness = {
  profiles: IProfilesComponent
  content: { fetchEntitiesByPointers: jest.Mock }
  wearablesFetcher: { fetchOwnedElements: jest.Mock }
  l2ThirdPartyItemChecker: { checkThirdPartyItems: jest.Mock }
}

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

async function createHarness(numbers: Record<string, number> = {}): Promise<Harness> {
  const nothingOwned = () => ({ fetchOwnedElements: jest.fn().mockResolvedValue({ elements: [], totalAmount: 0 }) })
  const config = {
    getString: jest.fn().mockResolvedValue(undefined),
    getNumber: jest.fn(async (key: string) => numbers[key])
  }
  const content = { fetchEntitiesByPointers: jest.fn() }
  const wearablesFetcher = nothingOwned()
  const l2ThirdPartyItemChecker = { checkThirdPartyItems: jest.fn().mockResolvedValue([]) }

  const profiles = await createProfilesComponent({
    content,
    config,
    logs: {
      getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() })
    },
    ownershipCaches: await createOwnershipCachesComponent({ config } as any),
    l1ThirdPartyItemChecker: { checkThirdPartyItems: jest.fn().mockResolvedValue([]) },
    l2ThirdPartyItemChecker,
    wearablesFetcher,
    emotesFetcher: nothingOwned(),
    namesFetcher: nothingOwned()
  } as any)

  return { profiles, content, wearablesFetcher, l2ThirdPartyItemChecker }
}

describe('when fetching a batch of profiles', () => {
  let profiles: IProfilesComponent
  let content: Harness['content']
  let wearablesFetcher: Harness['wearablesFetcher']
  let l2ThirdPartyItemChecker: Harness['l2ThirdPartyItemChecker']
  let addresses: string[]
  let result: ProfileMetadata[] | undefined

  beforeEach(async () => {
    ;({ profiles, content, wearablesFetcher, l2ThirdPartyItemChecker } = await createHarness())
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

  describe('and the same profile deployment is requested again', () => {
    let first: ProfileMetadata[] | undefined

    beforeEach(async () => {
      content.fetchEntitiesByPointers.mockResolvedValue([profileEntity('0x1', [])])
      first = await profiles.getProfiles(['0x1'])
      result = await profiles.getProfiles(['0x1'])
    })

    it('should resolve ownership only once and serve the repeat from memory', () => {
      expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledTimes(1)
    })

    it('should answer both requests with the same profile', () => {
      expect(result).toEqual(first)
    })
  })

  describe('and the profile was redeployed between two requests', () => {
    beforeEach(async () => {
      content.fetchEntitiesByPointers.mockResolvedValueOnce([profileEntity('0x1', [])])
      await profiles.getProfiles(['0x1'])
      content.fetchEntitiesByPointers.mockResolvedValueOnce([{ ...profileEntity('0x1', []), id: 'entity-0x1-v2' }])
      result = await profiles.getProfiles(['0x1'])
    })

    it('should resolve ownership again for the new deployment', () => {
      expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and the memory window elapsed between two requests', () => {
    beforeEach(async () => {
      ;({ profiles, content, wearablesFetcher } = await createHarness({ PROFILES_CACHE_MAX_AGE: 20 }))
      content.fetchEntitiesByPointers.mockResolvedValue([profileEntity('0x1', [])])
      await profiles.getProfiles(['0x1'])
      await new Promise((resolve) => setTimeout(resolve, 40))
      result = await profiles.getProfiles(['0x1'])
    })

    it('should resolve ownership again', () => {
      expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and two addresses resolve to entities sharing one id', () => {
    beforeEach(async () => {
      content.fetchEntitiesByPointers.mockResolvedValueOnce([{ ...profileEntity('0x1', []), id: 'shared' }])
      await profiles.getProfiles(['0x1'])
      content.fetchEntitiesByPointers.mockResolvedValueOnce([{ ...profileEntity('0x2', []), id: 'shared' }])
      result = await profiles.getProfiles(['0x2'])
    })

    it("should serve the second address its own identity rather than the first one's memoized profile", () => {
      expect(result?.[0].avatars[0].ethAddress).toBe('0x2')
    })

    it('should resolve ownership for the second address separately', () => {
      expect(wearablesFetcher.fetchOwnedElements).toHaveBeenCalledTimes(2)
    })
  })

  describe('and a memoized profile is handed back', () => {
    beforeEach(async () => {
      content.fetchEntitiesByPointers.mockResolvedValue([profileEntity('0x1', [])])
      result = await profiles.getProfiles(['0x1'])
    })

    it('should be frozen all the way down so a mutation cannot poison later requests', () => {
      expect(Object.isFrozen(result?.[0].avatars[0].avatar)).toBe(true)
    })
  })
})
