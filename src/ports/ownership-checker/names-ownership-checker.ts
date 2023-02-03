import { getCachedNFTsAndPendingCheckNFTs, fillCacheWithRecentlyCheckedWearables } from '../../logic/cache'
import { mergeMapIntoMap } from '../../logic/maps'
import { ownedNFTsByAddress } from '../../logic/ownership'
import { AppComponents, NFTsOwnershipChecker } from '../../types'
import { runQuery, TheGraphComponent } from '../the-graph'

export function createNamesOwnershipChecker(
  cmpnnts: Pick<AppComponents, 'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches'>
): NFTsOwnershipChecker {
  let ownedNamesByAddress: Map<string, string[]> = new Map()
  const components = cmpnnts
  const cache = components.ownershipCaches.namesCache

  function addNFTsForAddress(address: string, nfts: string[]) {
    ownedNamesByAddress.set(address, nfts)
  }

  async function checkNFTsOwnership() {
    // Check the cache before checking ownership in the blockchain
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(
      ownedNamesByAddress,
      cache
    )

    // Check ownership for the non-cached nfts
    ownedNamesByAddress = await ownedNFTsByAddress(components, nftsToCheckByAddress, queryNamesSubgraph)

    // Traverse the checked nfts to set the cache depending on its ownership
    fillCacheWithRecentlyCheckedWearables(nftsToCheckByAddress, ownedNamesByAddress, cache)

    // Merge cachedOwnedNFTsByAddress (contains the nfts which ownershipwas cached) into ownedWearablesByAddress (recently checked ownnership map)
    mergeMapIntoMap(cachedOwnedNFTsByAddress, ownedNamesByAddress)
  }

  function getOwnedNFTsForAddress(address: string) {
    return ownedNamesByAddress.get(address) ?? []
  }

  return {
    addNFTsForAddress,
    checkNFTsOwnership,
    getOwnedNFTsForAddress
  }
}

async function queryNamesSubgraph(
  theGraph: TheGraphComponent,
  nftsToCheck: [string, string[]][]
): Promise<{ owner: string; ownedNFTs: string[] }[]> {
  const result = await checkForNamesOwnership(theGraph, nftsToCheck)
  return result.map(({ names, owner }) => ({ ownedNFTs: names, owner }))
}

async function checkForNamesOwnership(
  theGraph: TheGraphComponent,
  namesToCheck: [string, string[]][]
): Promise<{ owner: string; names: string[] }[]> {
  // Build query for subgraph
  const subgraphQuery = `{` + namesToCheck.map((query) => getNamesFragment(query)).join('\n') + `}`

  // Run query
  const queryResponse = await runQuery<Map<string, { name: string }[]>>(theGraph.ensSubgraph, subgraphQuery, {})

  // Transform result to array of owner and urns
  return Object.entries(queryResponse).map(([addressWithPrefix, names]) => ({
    owner: addressWithPrefix.substring(1),
    names: names.map((nameObj: { name: string }) => nameObj.name)
  }))
}

function getNamesFragment([ethAddress, names]: [string, string[]]) {
  const nameList = names.map((name) => `"${name}"`).join(',')
  // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
  return `
      P${ethAddress}: nfts(where: { owner: "${ethAddress}", category: ens, name_in: [${nameList}] }, first: 1000) {
        name
      }
    `
}
