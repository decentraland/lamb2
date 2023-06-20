import { TheGraphComponent } from '../ports/the-graph'
import { AppComponents } from '../types'

async function withTime<T>(which: string, what: () => Promise<T>) {
  const start = Date.now()
  try {
    return await what()
  } finally {
    const end = Date.now()
    console.log(`${which} took ${end - start}ms`)
  }
}

function eqSet(xs: Set<string>, ys: Set<string>) {
  return xs.size === ys.size && [...xs].every((x) => ys.has(x))
}

function equal(actual: Map<string, string[]>, expected: Map<string, string[]>) {
  if (!eqSet(new Set(actual.keys()), new Set(expected.keys()))) {
    return false
  }

  for (const [ethAddress, nfts] of actual) {
    const expectedNfts = expected.get(ethAddress)
    if (!expectedNfts || !eqSet(new Set(nfts), new Set(expectedNfts))) {
      return false
    }
  }

  return true
}

/*
 * Checks the ownership for every nft resulting in a map of ownership for every eth address.
 * Receive a `querySubgraph` method to know how to do the query.
 */
export async function ownedNFTsByAddress(
  components: Pick<AppComponents, 'config' | 'fetch' | 'theGraph'>,
  nftIdsByAddressToCheck: Map<string, string[]>,
  querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any
): Promise<Map<string, string[]>> {
  // Check ownership for unknown nfts
  const ownedNftIdsByEthAddress = await withTime<Map<string, string[]>>('theGraph', () =>
    querySubgraphByFragments(components, nftIdsByAddressToCheck, querySubgraph)
  )

  const peter = await withTime<Map<string, string[]>>('peter', () => queryPeter(components, nftIdsByAddressToCheck))

  if (!equal(ownedNftIdsByEthAddress, peter)) {
    console.log('different results', {
      theGraph: JSON.stringify(Object.fromEntries(ownedNftIdsByEthAddress)),
      peter: JSON.stringify(Object.fromEntries(peter))
    })
  }

  // Fill the final map with nfts ownership
  for (const [ethAddress, nfts] of nftIdsByAddressToCheck) {
    const ownedNfts = ownedNftIdsByEthAddress.get(ethAddress)
    // If the query to the subgraph failed, then consider the nft as owned
    if (!ownedNfts) ownedNftIdsByEthAddress.set(ethAddress, nfts)
  }
  return ownedNftIdsByEthAddress
}

/**
 * Return a set of the NFTs that are actually owned by the eth address, for every eth address, based on ownership-server
 */
async function queryPeter(
  components: Pick<AppComponents, 'fetch' | 'config'>,
  nftIdsByAddressToCheck: Map<string, string[]>
): Promise<Map<string, string[]>> {
  const { config, fetch } = components
  const ownershipServerBaseUrl = await config.requireString('OWNERSHIP_SERVER_BASE_URL')
  const timestamp = Date.now()
  const result: Map<string, string[]> = new Map()

  for (const [ethAddress, nfts] of nftIdsByAddressToCheck.entries()) {
    if (nfts.length > 0) {
      const response = await fetch.fetch(
        `${ownershipServerBaseUrl}/ownsItems?address=${ethAddress}&timestamp=${timestamp}&itemUrn=${nfts.join(
          '&itemUrn='
        )}`
      )
      if (response.ok) {
        const json = await response.json()
        result.set(ethAddress, json.ownedUrns)
      }
    }
  }

  return result
}

/*
 * Return a set of the NFTs that are actually owned by the eth address, for every eth address.
 * Receive a `querySubgraph` method to know how to do the query.
 */
async function querySubgraphByFragments(
  components: Pick<AppComponents, 'theGraph' | 'config'>,
  nftIdsByAddressToCheck: Map<string, string[]>,
  querySubgraph: (theGraph: TheGraphComponent, nftsToCheck: [string, string[]][]) => any
): Promise<Map<string, string[]>> {
  const { theGraph, config } = components
  const nft_fragments_per_query = parseInt((await config.getString('NFT_FRAGMENTS_PER_QUERY')) ?? '10')
  const entries = Array.from(nftIdsByAddressToCheck.entries())
  const result: Map<string, string[]> = new Map()

  // Make multiple queries to graph as at most NFT_FRAGMENTS_PER_QUERY per time
  let offset = 0
  while (offset < entries.length) {
    const slice = entries.slice(offset, offset + nft_fragments_per_query)
    try {
      const queryResult = await querySubgraph(theGraph, slice)
      for (const { ownedNFTs, owner } of queryResult) {
        result.set(owner, ownedNFTs)
      }
    } catch (error) {
      // TODO: logger
      console.log(error)
    } finally {
      offset += nft_fragments_per_query
    }
  }

  return result
}
