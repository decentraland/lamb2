import { createElementsFetcherComponent } from '../../../src/adapters/elements-fetcher'
import { FetcherError } from '../../../src/adapters/elements-fetcher'
import { InvalidRequestError } from '../../../src/types'

const dependencies = {
  logs: { getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() }) }
} as any

describe('when fetching owned elements fails', () => {
  let address: string

  beforeEach(() => {
    address = '0xAbCdEf0000000000000000000000000000000001'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the request itself was rejected as invalid', () => {
    let fetcher: ReturnType<typeof createElementsFetcherComponent>

    beforeEach(() => {
      fetcher = createElementsFetcherComponent(dependencies, async () => {
        throw new InvalidRequestError('Invalid category requested.')
      })
    })

    it('should keep the invalid request error so it is not reported as an upstream failure', async () => {
      await expect(fetcher.fetchOwnedElements(address)).rejects.toThrow(InvalidRequestError)
    })
  })

  describe('and the upstream source failed', () => {
    let fetcher: ReturnType<typeof createElementsFetcherComponent>

    beforeEach(() => {
      fetcher = createElementsFetcherComponent(dependencies, async () => {
        throw new Error('subgraph is down')
      })
    })

    it('should report it as a fetcher error', async () => {
      await expect(fetcher.fetchOwnedElements(address)).rejects.toThrow(FetcherError)
    })
  })
})
