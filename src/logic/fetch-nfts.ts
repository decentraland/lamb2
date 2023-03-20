import { ISubgraphComponent } from '@well-known-components/thegraph-component'
import { ItemFromQuery } from '../adapters/items-fetcher'
import { LAND, LANDFromQuery } from '../adapters/lands-fetcher'
import { NameFromQuery } from '../adapters/names-fetcher'
import { AppComponents, Item, Name } from '../types'
import { compareByRarity } from './utils'

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
