import { WearableDefinition } from '@dcl/schemas'
import { FetcherError } from '../../adapters/elements-fetcher'
import { ThirdPartyProviderFetcherError } from '../../adapters/third-party-providers-fetcher'
import {
  fetchThirdPartyWearablesFromThirdPartyName,
  ThirdPartyNotFoundError
} from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { parseUrn } from '../../logic/utils'
import { ErrorResponse, HandlerContextWithPath, PaginatedResponse, ThirdPartyWearable } from '../../types'
import { createBaseSorting } from '../../logic/sorting'

function createFilter(url: URL): (item: ThirdPartyWearable) => boolean {
  const categories = url.searchParams.has('category') ? url.searchParams.getAll('category') : []
  const name = url.searchParams.has('name') ? url.searchParams.get('name') : undefined

  return (item: ThirdPartyWearable) => {
    if (categories && categories.length > 0 && !categories.includes(item.category)) {
      return false
    }
    if (name && !item.name.toLowerCase().includes(name.toLowerCase())) {
      return false
    }
    return true
  }
}

// TODO: change this name
export type ThirdPartyWearableResponse = ThirdPartyWearable & {
  definition?: WearableDefinition
}

export async function thirdPartyWearablesHandler(
  context: HandlerContextWithPath<
    'wearableDefinitionsFetcher' | 'logs' | 'thirdPartyWearablesFetcher',
    '/users/:address/third-party-wearables'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { logs, thirdPartyWearablesFetcher } = context.components
  const { address } = context.params
  const logger = logs.getLogger('third-party-wearables-handler')
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)
  const filter = createFilter(context.url)
  const sorting = createBaseSorting(context.url)

  try {
    const page = await fetchAndPaginate<ThirdPartyWearable & { definition: WearableDefinition }>(
      address,
      thirdPartyWearablesFetcher.fetchOwnedElements,
      pagination,
      filter,
      sorting
    )
    if (includeDefinitions) {
      return {
        status: 200,
        body: {
          ...page
        }
      }
    } else {
      const elementsWithoutDefinitions: (ThirdPartyWearable & { definition?: WearableDefinition })[] =
        page.elements.map((e) => {
          const { definition, ...restOfElement } = e
          return { ...restOfElement }
        })
      const { elements, ...restOfPage } = page
      return {
        status: 200,
        body: {
          elements: elementsWithoutDefinitions,
          ...restOfPage
        }
      }
    }
  } catch (err: any) {
    if (err instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch third party wearables right now'
        }
      }
    } else if (err instanceof ThirdPartyProviderFetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch third parties right now'
        }
      }
    }
    logger.error(err)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}

export async function thirdPartyCollectionWearablesHandler(
  context: HandlerContextWithPath<
    | 'wearableDefinitionsFetcher'
    | 'logs'
    | 'thirdPartyWearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'theGraph'
    | 'fetch',
    '/users/:address/third-party-wearables/:collectionId'
  >
): Promise<PaginatedResponse<ThirdPartyWearableResponse> | ErrorResponse> {
  const { wearableDefinitionsFetcher, logs } = context.components
  const logger = logs.getLogger('third-party-collections-handler')
  const { address, collectionId } = context.params

  // Strip the last part (the 6th part) if a collection contract id is specified
  const collectionIdCleaned = collectionId.split(':').slice(0, 5).join(':')

  const urn = await parseUrn(collectionIdCleaned)
  if (!urn) {
    return {
      status: 400,
      body: {
        error: 'Invalid collection id: not a valid URN'
      }
    }
  }

  if (urn.type !== 'blockchain-collection-third-party-name') {
    return {
      status: 400,
      body: {
        error:
          'Invalid collection id: not a blockchain-collection-third-party-name nor blockchain-collection-third-party-collection URN'
      }
    }
  }

  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  try {
    const page = await fetchAndPaginate<ThirdPartyWearable>(
      address,
      (address: string) => fetchThirdPartyWearablesFromThirdPartyName(context.components, address, urn),
      pagination
    )

    if (includeDefinitions) {
      const wearables = page.elements
      const definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(
        wearables.map((wearable) => wearable.urn)
      )
      const results: ThirdPartyWearableResponse[] = []
      for (let i = 0; i < wearables.length; ++i) {
        results.push({
          ...wearables[i],
          definition: includeDefinitions ? definitions[i] : undefined
        })
      }
      page.elements = results
    }

    return {
      status: 200,
      body: {
        ...page
      }
    }
  } catch (err: any) {
    if (err instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch third partiy wearables right now'
        }
      }
    } else if (err instanceof ThirdPartyProviderFetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch third parties right now'
        }
      }
    } else if (ThirdPartyNotFoundError) {
      return {
        status: 502,
        body: {
          error: 'Third party not found'
        }
      }
    }
    logger.error(err)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}
