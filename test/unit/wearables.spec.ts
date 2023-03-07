import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createLogComponent } from '@well-known-components/logger'
import { EntityType } from 'dcl-catalyst-commons'
import { getWearablesForAddress } from '../../src/logic/wearables'
import { ContentComponent } from '../../src/ports/content'
import { createDefinitionsComponent } from '../../src/ports/definitions-component'
import { AppComponents, CachedThirdPartyWearable, CachedWearable } from '../../src/types'

let index = 0

function buildCachedWearable(): CachedWearable {
  const id = `${index++}`
  return {
    urn: `urn-${id}`,
    individualData: [
      {
        id: id,
        tokenId: `token-${id}`,
        transferredAt: index
      }
    ],
    amount: 1,
    rarity: 'legendary'
  }
}

function buildCachedThirdParty(): CachedThirdPartyWearable {
  const id = `${index++}`
  return {
    urn: `urn-${id}`,
    individualData: [
      {
        id: id,
        tokenId: `token-${id}`
      }
    ],
    amount: 1
  }
}

describe('wearables (logic) unit tests', () => {
  const address = '0x0'
  let content: ContentComponent
  let components: Pick<AppComponents, 'wearablesComponent' | 'thirdPartyComponent' | 'definitions' | 'logs'>

  beforeEach(async () => {
    const logs = await createLogComponent({})
    const config = createConfigComponent({})

    const wearablesComponent = {
      fetchByOwner: jest.fn(() => [buildCachedWearable()])
    }

    const thirdPartyComponent = {
      fetchByOwner: jest.fn(() => [buildCachedThirdParty()])
    }

    content = {
      getExternalContentServerUrl: () => 'https://test-content',
      fetchEntitiesByPointers: async (_type: EntityType, _pointers: string[]) => []
    }

    const definitions = await createDefinitionsComponent({ config, content })

    components = { logs, wearablesComponent, thirdPartyComponent, definitions } as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function testDelegationToComponents(includeDefinitions: boolean, includeTPW: boolean) {
    it(`should delegate to proper component definitions=${includeDefinitions}, includeTPW=${includeTPW}`, async () => {
      const decorateNFTsWithDefinitionsSpy = jest.spyOn(components.definitions, 'decorateNFTsWithDefinitions')

      const pagination = {
        pageSize: 10,
        pageNum: 0
      }
      const { wearables, totalAmount } = await getWearablesForAddress(
        components as any,
        address,
        { includeTPW, includeDefinitions },
        pagination
      )

      expect(components.wearablesComponent.fetchByOwner).toHaveBeenCalledTimes(1)
      expect(components.thirdPartyComponent.fetchByOwner).toHaveBeenCalledTimes(includeTPW ? 1 : 0)
      expect(decorateNFTsWithDefinitionsSpy).toHaveBeenCalledTimes(includeDefinitions ? 1 : 0)

      const expectedLen = includeTPW ? 2 : 1
      expect(totalAmount).toEqual(expectedLen)
      expect(wearables).toHaveLength(expectedLen)
    })
  }

  for (const includeDefinitions of [true, false]) {
    for (const includeTPW of [true, false]) {
      testDelegationToComponents(includeDefinitions, includeTPW)
    }
  }

  it(`should order by rarity`, async () => {
    const pagination = {
      pageSize: 10,
      pageNum: 0,
      orderBy: 'rarity'
    }

    const wearables = [buildCachedWearable(), buildCachedWearable(), buildCachedWearable()]

    wearables[0].rarity = 'legendary'
    wearables[1].rarity = 'epic'
    wearables[2].rarity = 'common'

    components.wearablesComponent.fetchByOwner = jest.fn(() => Promise.resolve(wearables))
    content.fetchEntitiesByPointers = async (_type: EntityType, _pointers: string[]) => {}

    const result = await getWearablesForAddress(
      components as any,
      address,
      { includeTPW: false, includeDefinitions: true },
      pagination
    )

    expect(result.totalAmount).toEqual(wearables.length)
    expect(result.wearables).toHaveLength(wearables.length)

    console.log(result.wearables.map((w) => w.definition.rarity))
  })
})
