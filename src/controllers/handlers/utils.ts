import { Entity, WearableDefinition, EmoteDefinition } from '@dcl/schemas'
import { ElementsFilters } from '../../adapters/elements-fetcher'
import { paginationObject } from '../../logic/pagination'
import { createSorting } from '../../logic/sorting'

/**
 * Extracts filters from URL search parameters
 */
export function extractFiltersFromURL(url: URL): ElementsFilters {
  const filters: ElementsFilters = {}

  if (url.searchParams.has('category')) {
    filters.category = url.searchParams.get('category')!
  }
  if (url.searchParams.has('rarity')) {
    filters.rarity = url.searchParams.get('rarity')!
  }
  if (url.searchParams.has('name')) {
    filters.name = url.searchParams.get('name')!
  }
  if (url.searchParams.has('orderBy')) {
    filters.orderBy = url.searchParams.get('orderBy')!
  }
  if (url.searchParams.has('direction')) {
    filters.direction = url.searchParams.get('direction')!
  }

  return filters
}

/**
 * Creates pagination and filters from URL, handling defaults consistently
 * Always returns valid pagination with defaults to prevent fetching all elements
 */
export function createPaginationAndFilters(url: URL, maxPageSize: number = Number.MAX_VALUE) {
  // Extract filters first
  const filters = extractFiltersFromURL(url)

  // Always create pagination object with defaults to prevent fetching all elements
  // This ensures consistent behavior and prevents performance issues
  const pagination = paginationObject(url, maxPageSize)

  // Validate sorting if present
  if (url.searchParams.has('orderBy')) {
    createSorting(url) // This will throw InvalidRequestError if invalid
  }

  return { pagination, filters }
}

/**
 * Common mapping logic for items with definitions and entities
 */
export function mapItemToResponse<T, R>(
  item: T,
  definition: WearableDefinition | EmoteDefinition | undefined,
  entity: Entity | undefined,
  itemMapper: (item: T) => Omit<R, 'definition' | 'entity'>
): R {
  return {
    ...itemMapper(item),
    definition,
    entity
  } as R
}

/**
 * Helper to handle definitions/entities fetching consistently
 */
export async function fetchDefinitionsAndEntities<T extends { urn: string }>(
  items: T[],
  includeDefinitions: boolean,
  includeEntities: boolean,
  definitionsFetcher?: {
    fetchItemsDefinitions: (urns: string[]) => Promise<(WearableDefinition | EmoteDefinition | undefined)[]>
  },
  entitiesFetcher?: { fetchEntities: (urns: string[]) => Promise<(Entity | undefined)[]> }
) {
  const urns = items.map((item) => item.urn)

  const [definitions, entities] = await Promise.all([
    includeDefinitions && definitionsFetcher ? definitionsFetcher.fetchItemsDefinitions(urns) : [],
    includeEntities && entitiesFetcher ? entitiesFetcher.fetchEntities(urns) : []
  ])

  return { definitions, entities }
}

/**
 * Normalizes different wearable formats to OnChainWearable format
 * Handles both OnChainWearable and WearableFromQuery formats
 */
export function normalizeWearableFormat(wearable: any): any {
  // Check if it's WearableFromQuery format
  const isWearableFromQuery = 'item' in wearable && 'metadata' in wearable

  if (isWearableFromQuery) {
    // Convert WearableFromQuery to OnChainWearable format
    return {
      urn: wearable.urn,
      amount: 1,
      individualData: [
        {
          id: `${wearable.urn}:${wearable.tokenId}`,
          tokenId: wearable.tokenId,
          transferredAt: wearable.transferredAt,
          price: wearable.item.price
        }
      ],
      rarity: wearable.item.rarity,
      category: wearable.metadata.wearable.category,
      name: wearable.metadata.wearable.name,
      minTransferredAt: wearable.transferredAt,
      maxTransferredAt: wearable.transferredAt
    }
  }

  // Already in OnChainWearable format
  return wearable
}
