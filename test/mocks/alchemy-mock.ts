import { AlchemyNftFetcher } from '../../src/adapters/alchemy-nft-fetcher'

export function createAlchemyNftFetcherMock(): AlchemyNftFetcher {
  const getNFTsForOwner = jest.fn()

  return {
    getNFTsForOwner
  }
}
