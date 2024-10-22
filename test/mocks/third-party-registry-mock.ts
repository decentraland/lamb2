import { ThirdPartyContractRegistry } from '../../src/ports/ownership-checker/third-party-contract-registry'

export function createThirdPartyContractRegistryMock(mock?: ThirdPartyContractRegistry): ThirdPartyContractRegistry {
  return (
    mock ?? {
      isErc721: jest.fn(),
      isErc1155: jest.fn(),
      isUnknown: jest.fn(),
      ensureContractsKnown: jest.fn()
    }
  )
}
