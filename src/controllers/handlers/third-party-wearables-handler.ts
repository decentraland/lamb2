import { WearableDefinition } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { parseUrn } from '../../logic/utils'
import {
  ErrorResponse,
  HandlerContextWithPath,
  InvalidRequestError,
  PaginatedResponse,
  ThirdPartyWearable
} from '../../types'
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
  const { thirdPartyWearablesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filter = createFilter(context.url)
  const sorting = createBaseSorting(context.url)

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
    const elementsWithoutDefinitions: (ThirdPartyWearable & { definition?: WearableDefinition })[] = page.elements.map(
      (e) => {
        const { definition, ...restOfElement } = e
        return { ...restOfElement }
      }
    )
    const { elements, ...restOfPage } = page
    return {
      status: 200,
      body: {
        elements: elementsWithoutDefinitions,
        ...restOfPage
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
  const { wearableDefinitionsFetcher } = context.components
  const { address, collectionId } = context.params

  // Strip the last part (the 6th part) if a collection contract id is specified
  const collectionIdCleaned = collectionId.split(':').slice(0, 5).join(':')

  const urn = await parseUrn(collectionIdCleaned)
  if (!urn) {
    throw new InvalidRequestError('Invalid collection id: not a valid URN')
  }

  if (urn.type !== 'blockchain-collection-third-party-name') {
    throw new InvalidRequestError(
      'Invalid collection id: not a blockchain-collection-third-party-name nor blockchain-collection-third-party-collection URN'
    )
  }

  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

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
}

export type ThirdPartyIntegration = {
  name: string
  description: string
  urn: string
}

export type ThirdPartyIntegrationsResponse = {
  status: 200
  body: {
    data: ThirdPartyIntegration[]
  }
}

export async function thirdPartyIntegrationsHandler(
  context: HandlerContextWithPath<'thirdPartyProvidersFetcher', '/third-party-integrations'>
): Promise<ThirdPartyIntegrationsResponse | ErrorResponse> {
  const providers = await context.components.thirdPartyProvidersFetcher.getAll()
  const integrations = providers.map((p) => ({
    name: p.metadata.thirdParty.name,
    description: p.metadata.thirdParty.description,
    urn: p.id
  }))
  return {
    status: 200,
    body: { data: integrations }
  }
}
