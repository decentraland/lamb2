import { BlockchainCollectionThirdPartyCollection } from '@dcl/urn-resolver'
import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { FetcherError, FetcherErrorCode } from '../adapters/elements-fetcher'
import {
  AppComponents,
  Item,
  LAND,
  Limits,
  Name,
  ThirdParty,
  ThirdPartyAsset,
  ThirdPartyAssets,
  ThirdPartyWearable
} from '../types'
import { compareByRarity, findAsync, parseUrn } from './utils'

const THE_GRAPH_PAGE_SIZE = 1000

type NFT = {
  id: string
}

type QueryResults<E extends NFT> = {
  nfts: E[]
}

async function fetchAllNFTs<T, E extends NFT>(
  subgraph: ISubgraphComponent,
  query: string,
  address: string,
  mapToModel: (e: E) => T
): Promise<T[]> {
  const elements = []

  const owner = address.toLowerCase()
  let idFrom = ''
  let result: QueryResults<E>
  do {
    result = await subgraph.query<QueryResults<E>>(query, {
      owner,
      idFrom
    })

    if (result.nfts.length === 0) {
      break
    }

    for (const nft of result.nfts) {
      elements.push(nft)
    }

    idFrom = elements[elements.length - 1].id
  } while (result.nfts.length === THE_GRAPH_PAGE_SIZE)
  return elements.map(mapToModel)
}

const QUERY_LANDS: string = `
  query fetchLANDsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { owner: $owner, category_in: [parcel, estate], id_gt: $idFrom },
      orderBy: transferredAt,
      orderDirection: desc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      id
      name,
      contractAddress,
      tokenId,
      category,
      parcel {
        x,
        y,
        data {
          description
        }
      }
      estate {
        data {
          description
        }
      },
      activeOrder {
        price
      },
      image
    }
  }`

export type LANDFromQuery = {
  id: string
  contractAddress: string
  tokenId: string
  category: string
  name: string | null
  parcel?: {
    x: string
    y: string
    data?: {
      description?: string
    }
  }
  estate?: {
    data?: {
      description?: string
    }
  }
  activeOrder?: {
    price: string
  }
  image: string
}

export async function fetchAllLANDs(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<LAND[]> {
  return fetchAllNFTs<LAND, LANDFromQuery>(components.theGraph.ensSubgraph, QUERY_LANDS, owner, (land) => {
    const { name, contractAddress, tokenId, category, parcel, estate, image, activeOrder } = land

    const isParcel = category === 'parcel'
    const x = isParcel ? parcel?.x : undefined
    const y = isParcel ? parcel?.x : undefined
    const description = isParcel ? parcel?.data?.description : estate?.data?.description
    return {
      name: name === null ? undefined : name,
      contractAddress,
      tokenId,
      category,
      x,
      y,
      description,
      price: activeOrder ? activeOrder.price : undefined,
      image
    }
  })
}

const QUERY_NAMES_PAGINATED: string = `
  query fetchNamesByOwner($owner: String, $idFrom: String) {
    nfts(
      where: {owner: $owner, category: "ens", id_gt: $idFrom }
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      id,
      name,
      contractAddress,
      tokenId,
      activeOrder {
        price
      }
    }
}`

export type NameFromQuery = {
  id: string
  name: string
  contractAddress: string
  tokenId: string
  activeOrder?: {
    price: string
  }
}

export async function fetchAllNames(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Name[]> {
  return fetchAllNFTs<Name, NameFromQuery>(components.theGraph.ensSubgraph, QUERY_NAMES_PAGINATED, owner, (n) => {
    const { name, contractAddress, tokenId, activeOrder } = n
    return {
      name,
      contractAddress,
      tokenId,
      price: activeOrder ? activeOrder.price : undefined
    }
  })
}

function groupItemsByURN(items: ItemFromQuery[]): Item[] {
  const itemsByURN = new Map<string, Item>()

  items.forEach((item) => {
    const individualData = {
      id: item.id,
      tokenId: item.tokenId,
      transferredAt: item.transferredAt,
      price: item.item.price
    }
    if (itemsByURN.has(item.urn)) {
      const itemFromMap = itemsByURN.get(item.urn)!
      itemFromMap.individualData.push(individualData)
      itemFromMap.amount = itemFromMap.amount + 1
    } else {
      itemsByURN.set(item.urn, {
        urn: item.urn,
        individualData: [individualData],
        rarity: item.item.rarity,
        amount: 1
      })
    }
  })

  return Array.from(itemsByURN.values())
}

type ItemCategory = 'wearable' | 'emote'

function createQueryForCategory(category: ItemCategory) {
  return `query fetchItemsByOwner($owner: String, $idFrom: String) {
    nfts(
      where: { id_gt: $idFrom, owner: $owner, category: "${category}"},
      orderBy: id,
      orderDirection: asc,
      first: ${THE_GRAPH_PAGE_SIZE}
    ) {
      urn,
      id,
      tokenId,
      category
      transferredAt,
      item {
        rarity,
        price
      }
    }
  }`
}

const QUERIES: Record<ItemCategory, string> = {
  emote: createQueryForCategory('emote'),
  wearable: createQueryForCategory('wearable')
}

export type ItemFromQuery = {
  urn: string
  id: string
  tokenId: string
  transferredAt: number
  item: {
    rarity: string
    price: number
  }
}

export async function fetchAllEmotes(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const emotes = await fetchAllNFTs<ItemFromQuery, ItemFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['emote'],
    owner,
    (n) => n
  )
  return groupItemsByURN(emotes).sort(compareByRarity)
}

export async function fetchAllWearables(components: Pick<AppComponents, 'theGraph'>, owner: string): Promise<Item[]> {
  const ethereumWearables = await fetchAllNFTs<ItemFromQuery, ItemFromQuery>(
    components.theGraph.ethereumCollectionsSubgraph,
    QUERIES['emote'],
    owner,
    (n) => n
  )
  const maticWearables = await fetchAllNFTs<ItemFromQuery, ItemFromQuery>(
    components.theGraph.maticCollectionsSubgraph,
    QUERIES['wearable'],
    owner,
    (n) => n
  )
  return groupItemsByURN(ethereumWearables.concat(maticWearables)).sort(compareByRarity)
}

const URN_THIRD_PARTY_NAME_TYPE = 'blockchain-collection-third-party-name'
const URN_THIRD_PARTY_ASSET_TYPE = 'blockchain-collection-third-party'

async function fetchAssets(
  components: Pick<AppComponents, 'theGraph' | 'thirdPartyProvidersFetcher' | 'fetch' | 'logs'>,
  owner: string,
  thirdParty: ThirdParty
) {
  const { logs, fetch } = components
  const logger = logs.getLogger('fetch-assets')
  const urn = await parseUrn(thirdParty.id)
  if (!urn || urn.type !== URN_THIRD_PARTY_NAME_TYPE) {
    throw new Error(`Couldn't parse third party id: ${thirdParty.id}`)
  }

  const baseUrl = new URL(thirdParty.resolver).href.replace(/\/$/, '')
  let url: string | undefined = `${baseUrl}/registry/${urn.thirdPartyName}/address/${owner}/assets`

  const allAssets: ThirdPartyAsset[] = []
  try {
    do {
      const response = await fetch.fetch(url, { timeout: 5000 })
      if (!response.ok) {
        logger.error(`Http status ${response.status} from ${url}`)
        break
      }
      const responseVal = await response.json()
      const assetsByOwner = responseVal as ThirdPartyAssets
      if (!assetsByOwner) {
        logger.error(`No assets found with owner: ${owner}, url: ${url}`)
        break
      }

      for (const asset of assetsByOwner.assets ?? []) {
        allAssets.push(asset)
      }

      url = assetsByOwner.next
    } while (url)
  } catch (err) {
    logger.error(`Error fetching assets with owner: ${owner}, url: ${url}`)
  }

  return allAssets
}

function groupThirdPartyWearablesByURN(assets: ThirdPartyAsset[]): ThirdPartyWearable[] {
  const wearablesByURN = new Map<string, ThirdPartyWearable>()

  for (const asset of assets) {
    if (wearablesByURN.has(asset.urn.decentraland)) {
      const wearableFromMap = wearablesByURN.get(asset.urn.decentraland)!
      wearableFromMap.individualData.push({ id: asset.id })
      wearableFromMap.amount = wearableFromMap.amount + 1
    } else {
      wearablesByURN.set(asset.urn.decentraland, {
        urn: asset.urn.decentraland,
        individualData: [
          {
            id: asset.id
          }
        ],
        amount: 1
      })
    }
  }

  return Array.from(wearablesByURN.values())
}

export async function fetchAllThirdPartyWearables(
  components: Pick<AppComponents, 'theGraph' | 'thirdPartyProvidersFetcher' | 'fetch' | 'logs'>,
  owner: string
): Promise<ThirdPartyWearable[]> {
  const thirdParties = await components.thirdPartyProvidersFetcher.get()

  // TODO: test if stateValue is keept in case of an exception
  const thirdPartyAssets = await Promise.all(
    thirdParties.map((thirdParty: ThirdParty) => fetchAssets(components, owner, thirdParty))
  )

  return groupThirdPartyWearablesByURN(thirdPartyAssets.flat())
}

export async function fetchAllThirdPartyWearablesCollection(
  components: Pick<
    AppComponents,
    'thirdPartyWearablesFetcher' | 'thirdPartyProvidersFetcher' | 'fetch' | 'logs' | 'theGraph'
  >,
  address: string,
  collectionUrn: BlockchainCollectionThirdPartyCollection,
  { offset, limit }: Limits
) {
  let results: ThirdPartyWearable[] = []

  const { elements: allWearables } = await components.thirdPartyWearablesFetcher.fetchAllByOwner(address)
  if (allWearables) {
    // NOTE: if third party wearables are in cache
    for (const wearable of allWearables) {
      const wearableUrn = await parseUrn(wearable.urn)
      if (
        wearableUrn &&
        wearableUrn.type === URN_THIRD_PARTY_ASSET_TYPE &&
        wearableUrn.collectionId === collectionUrn.collectionId &&
        wearableUrn.thirdPartyName === collectionUrn.thirdPartyName
      ) {
        results.push(wearable)
      }
    }
  }

  const thirdParty = await findAsync(
    // TODO: review this (await thirdPartiesCache.fetch(0))!,
    await components.thirdPartyProvidersFetcher.get(),
    async (thirdParty: ThirdParty): Promise<boolean> => {
      const urn = await parseUrn(thirdParty.id)
      return !!urn && urn.type === URN_THIRD_PARTY_NAME_TYPE && urn.thirdPartyName === collectionUrn.thirdPartyName
    }
  )

  if (!thirdParty) {
    // NOTE: currently lambdas return an empty array with status code 200 for this case
    throw new FetcherError(
      FetcherErrorCode.THIRD_PARTY_NOT_FOUND,
      `Third Party not found ${collectionUrn.thirdPartyName}`
    )
  }

  const assets = await fetchAssets(components, address, thirdParty)
  results = groupThirdPartyWearablesByURN(
    assets.filter((asset: ThirdPartyAsset) => {
      const [collectionId, _] = asset.id.split(':')
      return collectionId === collectionUrn.collectionId
    })
  )

  return {
    elements: results.slice(offset, offset + limit),
    totalAmount: results.length
  }
}
