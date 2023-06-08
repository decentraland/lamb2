import { WearableDefinition } from '@dcl/schemas'
import { fetchThirdPartyWearablesFromThirdPartyName } from '../../logic/fetch-elements/fetch-third-party-wearables'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { parseUrn } from '../../logic/utils'
import { HandlerContextWithPath, InvalidRequestError, ThirdPartyWearable } from '../../types'
import { createBaseSorting } from '../../logic/sorting'
import {
  GetThirdPartyCollection200,
  GetThirdPartyWearables200,
  ThirdPartyIntegrations
} from '@dcl/catalyst-api-specs/lib/client'

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
): Promise<{ status: 200; body: GetThirdPartyWearables200 }> {
  const { thirdPartyWearablesFetcher, wearableDefinitionsFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)
  const filter = createFilter(context.url)
  const sorting = createBaseSorting(context.url)

  const page = await fetchAndPaginate<ThirdPartyWearable>(
    () => thirdPartyWearablesFetcher.fetchOwnedElements(address),
    pagination,
    filter,
    sorting
  )

  const definitions = includeDefinitions
    ? await wearableDefinitionsFetcher.fetchItemsDefinitions(page.elements.map((e) => e.urn))
    : []

  const elements: ThirdPartyWearableResponse[] = includeDefinitions
    ? page.elements.map((e, i) => {
        const definition: WearableDefinition = definitions[i]!
        return { ...e, definition }
      })
    : page.elements

  return {
    status: 200,
    body: {
      ...page,
      elements
    }
  }
}

export async function thirdPartyCollectionWearablesHandler(
  context: HandlerContextWithPath<
    'wearableDefinitionsFetcher' | 'logs' | 'thirdPartyWearablesFetcher' | 'thirdPartyProvidersStorage' | 'fetch',
    '/users/:address/third-party-wearables/:collectionId'
  >
): Promise<{ status: 200; body: GetThirdPartyCollection200 }> {
  const { wearableDefinitionsFetcher } = context.components
  const { address, collectionId } = context.params

  // Strip the last part (the 6th part) if a collection contract id is specified
  const collectionIdCleaned = collectionId.split(':').slice(0, 5).join(':')

  const urn = await parseUrn(collectionIdCleaned)
  if (!urn) {
    throw new InvalidRequestError(`Invalid collection id: ${collectionId} not a valid URN`)
  }

  if (urn.type !== 'blockchain-collection-third-party-name') {
    throw new InvalidRequestError(
      'Invalid collection id: not a blockchain-collection-third-party-name nor blockchain-collection-third-party-collection URN'
    )
  }

  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url, Number.MAX_VALUE)

  const page = await fetchAndPaginate<ThirdPartyWearable>(
    () => fetchThirdPartyWearablesFromThirdPartyName(context.components, address, urn),
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
        definition: definitions[i]
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
  context: HandlerContextWithPath<'thirdPartyProvidersStorage', '/third-party-integrations'>
): Promise<{ status: 200; body: ThirdPartyIntegrations }> {
  const providers = await context.components.thirdPartyProvidersStorage.getAll()
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
