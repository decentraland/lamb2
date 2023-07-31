import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { ownedExtendedNFTsByAddress } from '../../logic/ownership'
import { AppComponents, ExtendedNFTsOwnershipChecker } from '../../types'
import { runQuery, TheGraphComponent } from '../the-graph'
import {
  fillCacheWithRecentlyCheckedExtendedWearables,
  getCachedNFTsAndPendingCheckExtendedNFTs
} from '../../logic/cache'
import { mergeMapIntoMapExtended } from '../../logic/maps'
import { parseUrn, resolveUrn } from '../../logic/utils'

export function createWearablesOwnershipChecker(
  components: Pick<AppComponents, 'metrics' | 'content' | 'theGraph' | 'config' | 'ownershipCaches'>
): ExtendedNFTsOwnershipChecker {
  let ownedWearablesByAddress: Map<string, { urn: string; tokenId: string | undefined }[]> = new Map()
  const cache = components.ownershipCaches.wearablesCache

  async function addNFTsForAddress(address: string, nfts: string[]): Promise<void> {
    const ownedNFTs: { urn: string; tokenId: string | undefined }[] = await Promise.all(
      nfts.map(async (nft) => {
        const parsedData = await parseUrn(nft)

        if (
          parsedData &&
          (parsedData.type === 'blockchain-collection-v1-item' || parsedData.type === 'blockchain-collection-v2-item')
        ) {
          return resolveUrn(nft)
        } else {
          return { urn: nft, tokenId: undefined }
        }
      })
    )

    ownedWearablesByAddress.set(address, ownedNFTs)
  }

  async function checkNFTsOwnership() {
    // Check the cache before checking ownership in the blockchain
    const { nftsToCheckByAddress, cachedOwnedNFTsByAddress } = getCachedNFTsAndPendingCheckExtendedNFTs(
      ownedWearablesByAddress,
      cache
    )

    // Check ownership for the non-cached nfts
    ownedWearablesByAddress = await ownedExtendedNFTsByAddress(components, nftsToCheckByAddress, queryWearablesSubgraph)

    // Get unique nfts that were recently checked
    ownedWearablesByAddress = getUniqueMatchingNFTs(nftsToCheckByAddress, ownedWearablesByAddress)

    // Traverse the already checked nfts to set the cache depending on its ownership
    fillCacheWithRecentlyCheckedExtendedWearables(nftsToCheckByAddress, ownedWearablesByAddress, cache)

    // Merge cachedOwnedNFTsByAddress (contains the nfts which ownershipwas cached) into ownedWearablesByAddress (recently checked ownnership map)
    mergeMapIntoMapExtended(cachedOwnedNFTsByAddress, ownedWearablesByAddress)
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
  nftsToCheck: [string, { urn: string; tokenId: string | undefined }[]][]
): Promise<{ owner: string; ownedNFTs: { urn: string; tokenId: string | undefined }[] }[]> {
  const result = await checkForWearablesOwnership(theGraph, nftsToCheck)
  return result.map(({ urns, owner }) => ({ ownedNFTs: urns, owner }))
}

function splitWearablesByNetwork(wearableIdsToCheck: [string, { urn: string; tokenId: string | undefined }[]][]) {
  const ethereum: [string, { urn: string; tokenId: string | undefined }[]][] = []
  const matic: [string, { urn: string; tokenId: string | undefined }[]][] = []

  for (const [owner, urns] of wearableIdsToCheck) {
    const ethUrns = urns.filter((urn) => urn.urn.startsWith('urn:decentraland:ethereum'))
    if (ethUrns.length > 0) {
      ethereum.push([owner, ethUrns])
    }
    const maticUrns = urns.filter(
      (urn) => urn.urn.startsWith('urn:decentraland:matic') || urn.urn.startsWith('urn:decentraland:mumbai')
    )
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
  wearableIdsToCheck: [string, { urn: string; tokenId: string | undefined }[]][]
): Promise<{ owner: string; urns: { urn: string; tokenId: string | undefined }[] }[]> {
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
  wearableIdsToCheck: [string, { urn: string; tokenId: string | undefined }[]][],
  subgraph: ISubgraphComponent
): Promise<{ owner: string; urns: { urn: string; tokenId: string | undefined }[] }[]> {
  try {
    return getOwnersByWearable(wearableIdsToCheck, subgraph)
  } catch (error) {
    // TODO: logger
    console.log(error)
    return []
  }
}

async function getOwnersByWearable(
  wearableIdsToCheck: [string, { urn: string; tokenId: string | undefined }[]][],
  subgraph: ISubgraphComponent
): Promise<{ owner: string; urns: { urn: string; tokenId: string | undefined }[] }[]> {
  // Build query for subgraph
  const filtered = wearableIdsToCheck.filter(([, urns]) => urns.length > 0)
  if (filtered.length > 0) {
    const subgraphQuery = `{` + filtered.map((query) => getWearablesFragment(query)).join('\n') + `}`
    // Run query
    const queryResponse = await runQuery<Map<string, { urn: string; tokenId: string }[]>>(subgraph, subgraphQuery, {})

    // Transform the result to an array of { owner, urns: { urn, tokenId} }
    return Object.entries(queryResponse).map(([addressWithPrefix, wearables]) => ({
      owner: addressWithPrefix.substring(1), // Remove the 'P' prefix added previously
      urns: wearables.map((urnObj: { urn: string; tokenId: string }) => ({
        urn: urnObj.urn,
        tokenId: urnObj.tokenId
      }))
    }))
  }

  return wearableIdsToCheck.map(([owner]) => ({ owner, urns: [] }))
}

function getWearablesFragment([ethAddress, wearableIds]: [string, { urn: string; tokenId: string | undefined }[]]) {
  const urnList = wearableIds.map((wearableId) => `"${wearableId.urn}"`).join(',')

  // We need to add a 'P' prefix, because the graph needs the fragment name to start with a letter
  return `
        P${ethAddress}: nfts(where: { owner: "${ethAddress}", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [${urnList}] }, first: 1000) {
        urn
        tokenId
        }
    `
}

function concatWearables(
  ethereumWearablesOwners: { owner: string; urns: { urn: string; tokenId: string | undefined }[] }[],
  maticWearablesOwners: { owner: string; urns: { urn: string; tokenId: string | undefined }[] }[]
) {
  const allWearables: Map<string, { urn: string; tokenId: string | undefined }[]> = new Map<
    string,
    { urn: string; tokenId: string }[]
  >()

  ;[...ethereumWearablesOwners, ...maticWearablesOwners].forEach(({ owner, urns }) => {
    const existingUrns = allWearables.get(owner) ?? []
    allWearables.set(owner, existingUrns.concat(urns))
  })

  return Array.from(allWearables.entries()).map(([owner, urns]) => ({ owner, urns }))
}

function getUniqueMatchingNFTs(
  nftsToCheckByAddress: Map<
    string,
    {
      urn: string
      tokenId: string | undefined
    }[]
  >,
  ownedWearablesByAddress: Map<
    string,
    {
      urn: string
      tokenId: string | undefined
    }[]
  >
): Map<
  string,
  {
    urn: string
    tokenId: string | undefined
  }[]
> {
  const resultMap: Map<
    string,
    {
      urn: string
      tokenId: string | undefined
    }[]
  > = new Map()

  for (const [address, nftsToCheck] of nftsToCheckByAddress.entries()) {
    // Retrieve the owned wearables for the same address
    const ownedWearables = ownedWearablesByAddress.get(address) || []

    // To store matched items
    const matchedNFTs: {
      urn: string
      tokenId: string | undefined
    }[] = []

    for (const nft of nftsToCheck) {
      // If tokenId is undefined
      if (nft.tokenId === undefined) {
        // Check for any owned wearable with the same urn
        const owned = ownedWearables.find((o) => o.urn === nft.urn)
        if (owned && !matchedNFTs.some((m) => m.urn === owned.urn)) {
          matchedNFTs.push(owned)
        }
      } else {
        // If tokenId is defined, check both urn and tokenId
        const owned = ownedWearables.find((o) => o.urn === nft.urn && o.tokenId === nft.tokenId)
        if (owned && !matchedNFTs.some((m) => m.urn === owned.urn && m.tokenId === owned.tokenId)) {
          matchedNFTs.push(owned)
        }
      }
    }

    if (matchedNFTs.length > 0) {
      resultMap.set(address, matchedNFTs)
    }
  }

  return resultMap
}
