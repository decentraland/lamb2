import {
  get,
  isBaseEmote,
  isBaseWearable,
  isThirdParty,
  LAMBDAS_URL,
  OwnedItem,
  Page,
  post,
  Profile,
  splitUrnAndTokenId,
  wallet
} from './realm'

type Name = { name: string }

const ownedTokens = (items: OwnedItem[]): Map<string, Set<string>> =>
  new Map(items.map((item) => [item.urn, new Set(item.individualData.map((data) => data.tokenId))]))

const isOwned = (owned: Map<string, Set<string>>, worn: string): boolean => {
  const { urn, tokenId } = splitUrnAndTokenId(worn)
  const tokens = owned.get(urn)
  return tokens !== undefined && (tokenId === undefined || tokens.has(tokenId))
}

describe('when a wallet profile is requested', () => {
  let address: string
  let profile: Profile

  beforeEach(async () => {
    ;({ address } = await wallet())
    const response = await post<Profile[]>(`${LAMBDAS_URL}/profiles`, { ids: [address] })
    profile = response.body[0]
  })

  it('should carry the requested address as the avatar identity, whatever the deployed metadata says', () => {
    expect([profile.avatars[0].ethAddress, profile.avatars[0].userId]).toEqual([address, address])
  })

  describe('and its wearables are checked against the wallet inventory', () => {
    let owned: Map<string, Set<string>>
    let worn: string[]

    beforeEach(async () => {
      const inventory = await get<Page<OwnedItem>>(`${LAMBDAS_URL}/users/${address}/wearables?pageSize=1000`)
      owned = ownedTokens(inventory.body.elements)
      worn = profile.avatars[0].avatar.wearables.filter((urn) => !isBaseWearable(urn) && !isThirdParty(urn))
    })

    it('should only list on-chain wearables the wallet owns, token included', () => {
      expect(worn.filter((urn) => !isOwned(owned, urn))).toEqual([])
    })
  })

  describe('and its emotes are checked against the wallet inventory', () => {
    let owned: Map<string, Set<string>>
    let worn: string[]

    beforeEach(async () => {
      const inventory = await get<Page<OwnedItem>>(`${LAMBDAS_URL}/users/${address}/emotes?pageSize=1000`)
      owned = ownedTokens(inventory.body.elements)
      worn = (profile.avatars[0].avatar.emotes ?? []).map((emote) => emote.urn).filter((urn) => !isBaseEmote(urn))
    })

    it('should only list on-chain emotes the wallet owns, token included', () => {
      expect(worn.filter((urn) => !isOwned(owned, urn))).toEqual([])
    })
  })

  describe('and its claimed name is checked against the names the wallet owns', () => {
    let ownedNames: string[]

    beforeEach(async () => {
      const names = await get<Page<Name>>(`${LAMBDAS_URL}/users/${address}/names?pageSize=1000`)
      ownedNames = names.body.elements.map((element) => element.name.toLowerCase())
    })

    it('should only claim a name the wallet owns', () => {
      const avatar = profile.avatars[0]
      expect(!avatar.hasClaimedName || ownedNames.includes(avatar.name.toLowerCase())).toBe(true)
    })
  })

  describe('and the same profile is requested by GET', () => {
    let single: Awaited<ReturnType<typeof get<Profile>>>

    beforeEach(async () => {
      single = await get<Profile>(`${LAMBDAS_URL}/profiles/${address}`)
    })

    it('should answer the same profile', () => {
      expect(single.body).toEqual(profile)
    })
  })

  describe('and nothing was deployed since the If-Modified-Since date', () => {
    let response: Awaited<ReturnType<typeof post<unknown>>>

    beforeEach(async () => {
      response = await post(
        `${LAMBDAS_URL}/profiles`,
        { ids: [address] },
        { 'If-Modified-Since': new Date(Date.now() + 86_400_000).toUTCString() }
      )
    })

    it('should answer 304 with no body', () => {
      expect([response.status, response.text]).toEqual([304, ''])
    })
  })
})

describe('when profiles are requested for addresses that have none', () => {
  let missing: string
  let byPost: Awaited<ReturnType<typeof post<Profile[]>>>
  let byGet: Awaited<ReturnType<typeof get<unknown>>>
  let byLegacyAlias: Awaited<ReturnType<typeof get<unknown>>>

  beforeEach(async () => {
    missing = '0x0000000000000000000000000000000000000001'
    byPost = await post<Profile[]>(`${LAMBDAS_URL}/profiles`, { ids: [missing] })
    byGet = await get(`${LAMBDAS_URL}/profiles/${missing}`)
    byLegacyAlias = await get(`${LAMBDAS_URL}/profile/${missing}`)
  })

  it('should return no profiles for the batch', () => {
    expect(byPost.body).toEqual([])
  })

  it('should answer 404 on the canonical single-profile route', () => {
    expect(byGet.status).toBe(404)
  })

  it('should keep the legacy alias answering 200 with the empty stub', () => {
    expect([byLegacyAlias.status, byLegacyAlias.body]).toEqual([200, { avatars: [], timestamp: 0 }])
  })
})

describe('when a batch larger than the maximum is requested', () => {
  let response: Awaited<ReturnType<typeof post<unknown>>>

  beforeEach(async () => {
    const ids = Array.from({ length: 1001 }, (_, index) => `0x${index.toString(16).padStart(40, '0')}`)
    response = await post(`${LAMBDAS_URL}/profiles`, { ids })
  })

  it('should reject it instead of fanning out', () => {
    expect(response.status).toBe(400)
  })
})
