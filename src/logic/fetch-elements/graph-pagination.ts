import { EmoteCategory, Network, WearableCategory } from '@dcl/schemas'
import { ElementsFilters, ItemType } from '../../adapters/elements-fetcher'
import { InvalidRequestError } from '../../types'
import { THE_GRAPH_PAGE_SIZE } from './fetch-elements'

/** Builds the owner query for the given filters, or returns null when they cannot match anything. */
export type ItemQueryBuilder = (filters?: ElementsFilters) => string | null

/**
 * Builds the category `where` condition, or returns null when the requested category cannot
 * match any collection NFT so the caller can skip the query.
 *
 * The item category lives in `searchWearableCategory`/`searchEmoteCategory`: `nft.category`
 * holds the entity kind (wearable/emote/parcel/…), so filtering it by an item category
 * silently matches nothing. Both fields are GraphQL enums, so the value is interpolated
 * unquoted and has to be validated rather than trusted.
 */
function buildCategoryCondition(itemType: ItemType, filters?: ElementsFilters): string | null {
  if (!filters?.category) {
    return ''
  }

  const category = filters.category.toLowerCase()

  if (itemType === 'emote') {
    if (!EmoteCategory.validate(category)) {
      throw new InvalidRequestError(`Invalid category requested: '${filters.category}'.`)
    }
    return `, searchEmoteCategory: ${category}`
  }

  if (!WearableCategory.validate(category)) {
    throw new InvalidRequestError(`Invalid category requested: '${filters.category}'.`)
  }

  // The subgraph's WearableCategory enum has no `body_shape`: no collection NFT carries it.
  return category === WearableCategory.BODY_SHAPE ? null : `, searchWearableCategory: ${category}`
}

function buildItemTypeFilter(category: ItemType, network?: Network): string {
  if (category === 'smartWearable') {
    return `itemType: smart_wearable_v1`
  }

  if (category === 'emote') {
    return `itemType: emote_v1`
  }

  if (network === Network.MATIC) {
    // Polygon wearables: only wearable_v2 and smart_wearable_v1
    return `itemType_in: [wearable_v2, smart_wearable_v1]`
  }

  if (network === Network.ETHEREUM) {
    // Ethereum wearables: only wearable_v1
    return `itemType: wearable_v1`
  }

  // No network filter: all wearable types
  return `itemType_in: [wearable_v1, wearable_v2, smart_wearable_v1]`
}

/**
 * Creates a query builder for items (wearables/emotes).
 *
 * The query is always ordered by `id` ascending: that is the only order the `id_gt` keyset
 * cursor in `fetchAllNFTs` can walk without skipping or repeating rows. The order the caller
 * asked for is applied in memory, after grouping.
 *
 * The whole set has to be walked rather than paged in the subgraph: rows are grouped by URN
 * before being returned, so a page of rows is not a page of items, and ordering by rarity or
 * by the grouped transfer dates cannot be expressed here at all. `skip` is not the
 * alternative either -- The Graph's docs advise against it because it performs poorly at depth.
 */
export function createItemQueryBuilder(category: ItemType, network?: Network): ItemQueryBuilder {
  const itemTypeFilter = buildItemTypeFilter(category, network)
  const metadataField = ['wearable', 'smartWearable'].includes(category) ? 'wearable' : category

  return (filters) => {
    const categoryCondition = buildCategoryCondition(category, filters)
    if (categoryCondition === null) {
      return null
    }

    return `
    query fetchItemsByOwner($owner: String, $idFrom: ID) {
      nfts(
        where: { id_gt: $idFrom, owner: $owner, ${itemTypeFilter}${categoryCondition}},
        orderBy: id,
        orderDirection: asc,
        first: ${THE_GRAPH_PAGE_SIZE}
      ) {
        urn,
        id,
        tokenId,
        category,
        itemType,
        transferredAt,
        metadata {
          ${metadataField} {
            name,
            category
          }
        },
        item {
          rarity,
          price
        }
      }
    }`
  }
}
