import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { ownedNFTsByAddress } from '../../logic/ownership'
import { AppComponents, NFTsOwnershipChecker } from '../../types'
import { runQuery, TheGraphComponent } from '../the-graph'
import { fillCacheWithRecentlyCheckedWearables, getCachedNFTsAndPendingCheckNFTs } from '../../logic/cache'
import { mergeMapIntoMap } from '../../logic/maps'

export function createWearablesOwnershipChecker(
  components: Pick<AppComponents, 'config' | 'content' | 'metrics' | 'ownershipCaches' | 'theGraph'>
): NFTsOwnershipChecker {
  let ownedWearablesByAddress: Map<string, string[]> = new Map()
  const cache = components.ownershipCaches.wearablesCache

  function addNFTsForAddress(address: string, nfts: string[]) {
    ownedWearablesByAddress.set(address, nfts)
  }

  async function checkNFTsOwnership() {
    // Check the cache before checking ownership in the blockchain
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckNFTs(
      ownedWearablesByAddress,
      cache
    )

    // Check ownership for the non-cached nfts
    ownedWearablesByAddress = await ownedNFTsByAddress(components, nftsToCheckByAddress, queryWearablesSubgraph)

    // Traverse the already checked nfts to set the cache depending on its ownership
    fillCacheWithRecentlyCheckedWearables(nftsToCheckByAddress, ownedWearablesByAddress, cache)

    // Merge cachedOwnedNFTsByAddress (contains the nfts which ownershipwas cached) into ownedWearablesByAddress (recently checked ownnership map)
    mergeMapIntoMap(cachedOwnedNFTsByAddress, ownedWearablesByAddress)
  }

  function getOwnedNFTsForAddress(address: string) {
    return ownedWearablesByAddress.get(address) ?? []
  }

  return {
    addNFTsForAddress,
    checkNFTsOwnership,
    getOwnedNFTsForAddress
  }
}

async function queryWearablesSubgraph(
  theGraph: TheGraphComponent,
  nftsToCheck: [string, string[]][]
): Promise<{ owner: string; ownedNFTs: string[] }[]> {
  const result = await checkForWearablesOwnership(theGraph, nftsToCheck)
  return result.map(({ urns, owner }) => ({ ownedNFTs: urns, owner }))
}

function splitWearablesByNetwork(wearableIdsToCheck: [string, string[]][]) {
  const ethereum: [string, string[]][] = []
  const matic: [string, string[]][] = []

  for (const [owner, urns] of wearableIdsToCheck) {
    const ethUrns = urns.filter((urn) => urn.startsWith('urn:decentraland:ethereum'))
    if (ethUrns.length > 0) {
      ethereum.push([owner, ethUrns])
    }
    const maticUrns = urns.filter((urn) => urn.startsWith('urn:decentraland:matic'))
    if (maticUrns.length > 0) {
      matic.push([owner, maticUrns])
    }
  }

  return { ethereum, matic }
}

/**
 * This method returns all the owners from the given wearables URNs. It looks for them first in Ethereum and then in Matic
 * @param theGraph the graph component
 * @param wearableIdsToCheck pairs of ethAddress and a list of urns to check ownership
 * @returns the pairs of ethAddress and list of urns
 */
async function checkForWearablesOwnership(
  theGraph: TheGraphComponent,
  wearableIdsToCheck: [string, string[]][]
): Promise<{ owner: string; urns: string[] }[]> {
  const { ethereum, matic } = splitWearablesByNetwork(wearableIdsToCheck)
  const ethereumWearablesOwnersPromise = getOwnedWearables(ethereum, theGraph.ethereumCollectionsSubgraph)
  const maticWearablesOwnersPromise = getOwnedWearables(matic, theGraph.maticCollectionsSubgraph)
  const [ethereumWearablesOwners, maticWearablesOwners] = await Promise.all([
    ethereumWearablesOwnersPromise,
    maticWearablesOwnersPromise
  ])
  return concatWearables(ethereumWearablesOwners, maticWearablesOwners)
}

async function getOwnedWearables(
  wearableIdsToCheck: [string, string[]][],
  subgraph: ISubgraphComponent
): Promise<{ owner: string; urns: string[] }[]> {
  try {
    return getOwnersByWearable(wearableIdsToCheck, subgraph)
  } catch (error) {
    // TODO: logger
    console.log(error)
    return []
  }
}

async function getOwnersByWearable(
  wearableIdsToCheck: [string, string[]][],
  subgraph: ISubgraphComponent
): Promise<{ owner: string; urns: string[] }[]> {
  // Build query for subgraph
  const subgraphQuery = `{` + wearableIdsToCheck.map((query) => getWearablesFragment(query)).join('\n') + `}`

  // Run query
  const queryResponse = await runQuery<Map<string, { urn: string }[]>>(subgraph, subgraphQuery, {})

  // Transform the result to an array of { owner, urns }
  return Object.entries(queryResponse).map(([addressWithPrefix, wearables]) => ({
    owner: addressWithPrefix.substring(1), // Remove the 'P' prefix added previously because the graph needs the fragment name to start with a letter
    urns: wearables.map((urnObj: { urn: string }) => urnObj.urn)
  }))
}

function getWearablesFragment([ethAddress, wearableIds]: [string, string[]]) {
  const urnList = wearableIds.map((wearableId) => `"${wearableId}"`).join(',')

  // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
  return `
        P${ethAddress}: nfts(where: { owner: "${ethAddress}", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [${urnList}] }, first: 1000) {
        urn
        }
    `
}

function concatWearables(
  ethereumWearablesOwners: { owner: string; urns: string[] }[],
  maticWearablesOwners: { owner: string; urns: string[] }[]
) {
  const allWearables: Map<string, string[]> = new Map<string, string[]>()

  ethereumWearablesOwners.forEach((a) => {
    allWearables.set(a.owner, a.urns)
  })
  maticWearablesOwners.forEach((b) => {
    const existingUrns = allWearables.get(b.owner) ?? []
    allWearables.set(b.owner, existingUrns.concat(b.urns))
  })

  return Array.from(allWearables.entries()).map(([owner, urns]) => ({ owner, urns }))
}
