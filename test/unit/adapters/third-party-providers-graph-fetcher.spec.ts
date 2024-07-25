import { createLogComponent } from '@well-known-components/logger'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'
import { createThirdPartyProvidersGraphFetcherComponent } from '../../../src/adapters/third-party-providers-graph-fetcher'
import { getThirdPartyProviders } from '../../data/wearables'

describe('third-party-providers-graph-fetcher', () => {
  const mockedTheGraph = createTheGraphComponentMock()

  it('should fetch third party providers from TheGraph', async () => {
    // Arrange
    const expectedResponse = getThirdPartyProviders()

    mockedTheGraph.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue({
      thirdParties: expectedResponse
    })

    const sut = createThirdPartyProvidersGraphFetcherComponent({ theGraph: mockedTheGraph })

    // Act
    const response = await sut.get()

    expect(response).toEqual(expectedResponse)
  })

  it('should throw an error in case Third Party Providers could not be fetched', async () => {
    // Arrange
    mockedTheGraph.thirdPartyRegistrySubgraph.query = jest.fn().mockRejectedValue(new Error())

    const sut = createThirdPartyProvidersGraphFetcherComponent({ theGraph: mockedTheGraph })

    // Act & Assert
    await expect(sut.get()).rejects.toThrow()
  })
})
