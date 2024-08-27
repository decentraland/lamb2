import { ILoggerComponent } from '@well-known-components/interfaces'
import { createLogComponent } from '@well-known-components/logger'
import { createConfigComponent } from '@well-known-components/env-config-provider'
import { HTTPProvider } from 'eth-connect'
import {
  createThirdPartyItemChecker,
  ThirdPartyItemChecker
} from '../../../src/ports/ownership-checker/third-party-item-checker'
import { ThirdPartyContractRegistry } from '../../../src/ports/ownership-checker/third-party-contract-registry'
import { createHttpProviderMock } from '../../mocks/http-provider-mock'
import { createThirdPartyContractRegistryMock } from '../../mocks/third-party-registry-mock'
import { EntitiesFetcher } from '../../../src/adapters/entities-fetcher'
import { generateThirdPartyWearableEntities } from '../../data/wearables'

describe('third party item checker', () => {
  let logs: ILoggerComponent
  let thirdPartyItemChecker: ThirdPartyItemChecker
  let httpProvider: HTTPProvider
  let entitiesFetcher: EntitiesFetcher
  let registry: ThirdPartyContractRegistry

  beforeEach(async () => {
    logs = await createLogComponent({ config: createConfigComponent({ LOG_LEVEL: 'DEBUG' }) })
    httpProvider = createHttpProviderMock([
      [
        { jsonrpc: '2.0', id: 1, result: '0x00000000000000000000000069d30b1875d39e13a01af73ccfed6d84839e84f2' },
        {
          jsonrpc: '2.0',
          id: 2,
          error: {
            code: 3,
            data: '0x7e2732890000000000000000000000000000000000000000000000000000000000000046',
            message: 'execution reverted'
          }
        }
      ]
    ])
    entitiesFetcher = {
      fetchEntities: async (urns: string[]) => {
        return generateThirdPartyWearableEntities(urns)
      }
    }
    registry = createThirdPartyContractRegistryMock()
    thirdPartyItemChecker = await createThirdPartyItemChecker({ entitiesFetcher, logs }, httpProvider, registry)
  })

  it('correct validation of nfts', async () => {
    registry.isErc1155 = jest.fn().mockImplementation((contractAddress) => {
      return contractAddress === '0x1aca797764bd5c1e9f3c2933432a2be770a33941'
    })
    registry.isErc721 = jest.fn().mockImplementation((contractAddress) => {
      return contractAddress === '0x74c78f5a4ab22f01d5fd08455cf0ff5c3367535c'
    })
    registry.isUnknown = jest.fn().mockImplementation((contractAddress) => {
      return contractAddress === '0x7020117712a3fe09b7162ee3f932dae7673c6bdd'
    })
    const result = await thirdPartyItemChecker.checkThirdPartyItems('0x49f94A887Efc16993E69d4F07Ef3dE11A2C90897', [
      'urn:decentraland:amoy:collections-thirdparty:back-to-the-future:sepolia-8a50:f-bananacrown-4685:sepolia:0x7020117712a3fE09B7162eE3F932dae7673C6BDD:q34rasf',
      'urn:decentraland:amoy:collections-thirdparty:back-to-the-future:sepolia-8a50:f-bananacrown-4685:sepolia:0x7020117712a3fE09B7162eE3F932dae7673C6BDD:34',
      'urn:decentraland:amoy:collections-thirdparty:back-to-the-future:sepolia-8a50:f-bananacrown-4685:sepolia:0x74c78f5a4ab22f01d5fd08455cf0ff5c3367535c:7',
      'urn:decentraland:amoy:collections-thirdparty:back-to-the-future:sepolia-8a50:f-bananacrown-4685:sepolia:0x74c78f5a4ab22f01d5fd08455cf0ff5c3367535c:70',
      'urn:decentraland:amoy:collections-thirdparty:back-to-the-future:sepolia-8a50:f-bananacrown-4685:sepolia:0x1aca797764bd5c1e9F3c2933432a2be770A33941:5'
    ])

    expect(result).toEqual([false, false, false, false, false])
  })

  it('correct validation of nfts when nothing is requested', async () => {
    const result = await thirdPartyItemChecker.checkThirdPartyItems('0x49f94A887Efc16993E69d4F07Ef3dE11A2C90897', [])

    expect(result).toEqual([])
    expect(registry.isErc1155).not.toBeCalled()
    expect(registry.isErc721).not.toBeCalled()
    expect(registry.isUnknown).not.toBeCalled()
  })
})
