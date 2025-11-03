import { Entity } from '@dcl/schemas'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import { createCombinedSorting } from '../../logic/sorting'
import {
  AppComponents,
  HandlerContextWithPath,
  InvalidRequestError,
  OnChainEmote,
  PaginatedResponse
} from '../../types'
import { createFilters } from './items-commons'

export const ON_CHAIN = 'on-chain'

const VALID_COLLECTION_TYPES = ['on-chain']

export type MixedOnChainEmote = OnChainEmote & {
  type: typeof ON_CHAIN
  entity: Entity
}

export type MixedEmote = MixedOnChainEmote

export type MixedEmoteResponse = Omit<MixedEmote, 'minTransferredAt' | 'maxTransferredAt'>

export type MixedEmoteTrimmedResponse = {
  entity: Entity
  amount?: number
}

async function fetchCombinedElements(
  components: Pick<AppComponents, 'emotesFetcher' | 'entitiesFetcher'>,
  collectionTypes: string[],
  address: string
): Promise<MixedEmote[]> {
  async function fetchOnChainEmotes(): Promise<MixedOnChainEmote[]> {
    const { elements } = await components.emotesFetcher.fetchOwnedElements(address)
    if (!elements.length) {
      return []
    }

    const urns = elements.map((e) => e.urn)
    const entities = await components.entitiesFetcher.fetchEntities(urns)

    return elements.reduce<MixedOnChainEmote[]>((acc, emote, i) => {
      const entity = entities[i]
      if (entity) {
        acc.push({
          type: ON_CHAIN,
          ...emote,
          entity
        })
      }
      return acc
    }, [])
  }

  const emotes = collectionTypes.includes(ON_CHAIN) ? await fetchOnChainEmotes() : []

  return emotes
}

export async function explorerEmotesHandler(
  context: HandlerContextWithPath<'emotesFetcher' | 'entitiesFetcher', '/explorer/:address/emotes'>
): Promise<PaginatedResponse<MixedEmoteResponse> | PaginatedResponse<MixedEmoteTrimmedResponse>> {
  const { address } = context.params
  const pagination = paginationObject(context.url)
  const filter = createFilters(context.url)
  const sorting = createCombinedSorting(context.url)
  const collectionTypes = context.url.searchParams.has('collectionType')
    ? context.url.searchParams.getAll('collectionType')
    : VALID_COLLECTION_TYPES
  const trimmedParam = context.url.searchParams.get('trimmed')
  const isTrimmed = trimmedParam === 'true' || trimmedParam === '1'
  const includeAmountParam = context.url.searchParams.get('includeAmount')
  const includeAmount = includeAmountParam === 'true' || includeAmountParam === '1'

  if (collectionTypes.some((type) => !VALID_COLLECTION_TYPES.includes(type))) {
    throw new InvalidRequestError(`Invalid collection type. Valid types are: ${VALID_COLLECTION_TYPES.join(', ')}.`)
  }

  const page = await fetchAndPaginate<MixedEmote>(
    () => fetchCombinedElements(context.components, collectionTypes, address),
    pagination,
    filter,
    sorting
  )

  if (isTrimmed) {
    const results: MixedEmoteTrimmedResponse[] = page.elements.map((emote) => {
      const result: MixedEmoteTrimmedResponse = {
        entity: emote.entity
      }
      if (includeAmount) {
        result.amount = emote.individualData?.length || 0
      }
      return result
    })

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  } else {
    const results: MixedEmoteResponse[] = []
    for (const emote of page.elements) {
      const { minTransferredAt, maxTransferredAt, ...clean } = emote
      results.push({ ...clean })
    }

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  }
}
