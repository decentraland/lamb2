import { paginationObject } from '../../logic/utils'
import { Definition, HandlerContextWithPath, PaginatedResults, ThirdPartyWearable, Wearable } from '../../types'

// TODO: change this name
type WearableResponse = Pick<Wearable, 'urn' | 'amount' | 'individualData' | 'rarity'> & {
  definition?: Definition
}

export async function wearablesHandler(
  context: HandlerContextWithPath<'wearablesFetcher' | 'definitionsFetcher', '/users/:address/wearables'>
): Promise<PaginatedResults<WearableResponse>> {
  const { definitionsFetcher, wearablesFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  const { totalAmount, wearables } = await wearablesFetcher.fetchByOwner(address, pagination)

  const results: WearableResponse[] = wearables
  const definitions = includeDefinitions
    ? await definitionsFetcher.fetchWearablesDefinitions(wearables.map((w) => w.urn))
    : []

  for (let i = 0; i < wearables.length; ++i) {
    const { urn, amount, individualData, rarity } = wearables[i]
    results.push({
      urn,
      amount,
      individualData,
      rarity,
      definition: includeDefinitions ? definitions[i] : undefined
    })
  }

  return {
    status: 200,
    body: {
      elements: results,
      totalAmount: totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}

// TODO: change this name
type ThirdPartyWearableResponse = Pick<ThirdPartyWearable, 'urn' | 'amount' | 'individualData'> & {
  definition?: Definition
}

// TODO
// const collectionId = context.url.searchParams.get('collectionId')
//   // If collectionId is present, only that collection third-party wearables are sent
//   wearablesResponse = await getWearablesForCollection(context.components, collectionId, id, includeDefinitions)

export async function thirdPartyWearablesHandler(
  context: HandlerContextWithPath<
    'thirdPartyWearablesFetcher' | 'definitionsFetcher',
    '/users/:address/third-party-wearables'
  >
): Promise<PaginatedResults<ThirdPartyWearableResponse>> {
  const { thirdPartyWearablesFetcher, definitionsFetcher } = context.components
  const { address } = context.params
  const includeDefinitions = context.url.searchParams.has('includeDefinitions')
  const pagination = paginationObject(context.url)

  const { totalAmount, wearables } = await thirdPartyWearablesFetcher.fetchByOwner(address, pagination)

  const results: ThirdPartyWearableResponse[] = wearables
  const definitions = includeDefinitions
    ? await definitionsFetcher.fetchWearablesDefinitions(wearables.map((w) => w.urn))
    : []

  for (let i = 0; i < wearables.length; ++i) {
    const { urn, amount, individualData } = wearables[i]
    results.push({
      urn,
      amount,
      individualData,
      definition: includeDefinitions ? definitions[i] : undefined
    })
  }

  return {
    status: 200,
    body: {
      elements: results,
      totalAmount: totalAmount,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
  }
}
