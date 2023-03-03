import { createLogComponent } from '@well-known-components/logger'
import { getWearablesForAddress } from '../../src/logic/wearables'

const cachedWearables = [
  {
    urn: 'urn',
    individualData: [
      {
        id: 'token1'
      }
    ],
    amount: 1,
    rarity: 'legendary'
  }
]

const cachedThirdParty = [
  {
    urn: 'urn',
    individualData: [
      {
        id: 'token2'
      }
    ],
    amount: 1,
    rarity: 'legendary'
  }
]

describe('wearables (logic) unit tests', () => {
  it('should work', async () => {
    const logs = await createLogComponent({})
    const wearablesComponent = {
      fetchByOwner: jest.fn(() => [])
    }

    const thirdPartyComponent = {
      fetchByOwner: jest.fn(() => cachedWearables)
    }

    const definitions = {
      decorateNFTsWithDefinitions: jest.fn()
    }

    const components = { logs, wearablesComponent, thirdPartyComponent, definitions }
    const address = '0x0'
    const includeDefinitions = false
    const includeTPW = true
    const pagination = {
      pageSize: 10,
      pageNum: 0
      // orderBy
    }
    const { wearables, totalAmount } = await getWearablesForAddress(
      components as any,
      address,
      includeTPW,
      includeDefinitions,
      pagination
    )

    expect(wearablesComponent.fetchByOwner).toHaveBeenCalledTimes(1)
    expect(thirdPartyComponent.fetchByOwner).toHaveBeenCalledTimes(1)
    expect(definitions.decorateNFTsWithDefinitions).toHaveBeenCalledTimes(0)
    expect(totalAmount).toEqual(1)
    expect(wearables).toMatchObject([
      {
        urn: 'urn',
        individualData: [
          {
            id: 'token1'
          }
        ],
        amount: 1
      }
    ])
  })
})
