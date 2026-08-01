import { Entity, EntityType } from '@dcl/schemas'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createLogComponent } from '@well-known-components/logger'
import { EntitiesFetcher, createEntitiesFetcherComponent } from '../../../src/adapters/entities-fetcher'
import { MAX_POINTERS_PER_REQUEST } from '../../../src/logic/fetch-entities-in-batches'
import { createContentClientMock } from '../../mocks/content-mock'

const CONTENT_SERVER_POINTERS_LIMIT = 1000

function generateEntity(urn: string): Entity {
  return {
    version: 'v3',
    id: `entity-${urn}`,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: 0,
    content: [],
    metadata: { id: urn }
  }
}

function generateUrns(quantity: number): string[] {
  return Array.from({ length: quantity }, (_, index) => `urn:wearable:${index}`)
}

async function createFetcher(content: ReturnType<typeof createContentClientMock>): Promise<EntitiesFetcher> {
  return createEntitiesFetcherComponent({
    config: await createDotEnvConfigComponent({ path: ['.env.default', '.env'] }),
    logs: await createLogComponent({}),
    content,
    internalContentServerUrl: 'internalContentServerUrl',
    fetch: { fetch: jest.fn() }
  })
}

let content: ReturnType<typeof createContentClientMock>
let entitiesFetcher: EntitiesFetcher

afterEach(() => {
  jest.resetAllMocks()
})

describe('when fetching fewer urns than the content server pointers limit', () => {
  let urns: string[]
  let entities: (Entity | undefined)[]

  beforeEach(async () => {
    urns = generateUrns(10)
    content = createContentClientMock()
    content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => pointers.map(generateEntity))
    entitiesFetcher = await createFetcher(content)
    entities = await entitiesFetcher.fetchEntities(urns)
  })

  it('should resolve them in a single request', () => {
    expect(content.fetchEntitiesByPointers).toHaveBeenCalledTimes(1)
    expect(content.fetchEntitiesByPointers).toHaveBeenCalledWith(urns, {
      abortController: expect.any(AbortController)
    })
  })

  it('should return one entity per urn, aligned with the requested order', () => {
    expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
  })
})

describe('when fetching more urns than the content server pointers limit', () => {
  let urns: string[]
  let entities: (Entity | undefined)[]

  beforeEach(async () => {
    // A wallet owning this many items produced a single request the content server answered
    // with 400 (`pointers` maxItems is 1000), surfacing as a 500 to the client.
    urns = generateUrns(1939)
    content = createContentClientMock()
    content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => {
      if (pointers.length > CONTENT_SERVER_POINTERS_LIMIT) {
        throw new Error(`Invalid JSON body: pointers must NOT have more than ${CONTENT_SERVER_POINTERS_LIMIT} items`)
      }
      return pointers.map(generateEntity)
    })
    entitiesFetcher = await createFetcher(content)
    entities = await entitiesFetcher.fetchEntities(urns)
  })

  it('should split the work into batches the content server accepts', () => {
    for (const call of (content.fetchEntitiesByPointers as jest.Mock).mock.calls) {
      expect(call[0].length).toBeLessThanOrEqual(MAX_POINTERS_PER_REQUEST)
    }
  })

  it('should resolve every urn, in the requested order, with no holes', () => {
    expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
  })
})

describe('when the same urns are fetched twice', () => {
  let urns: string[]
  let entities: (Entity | undefined)[]

  beforeEach(async () => {
    urns = generateUrns(600)
    content = createContentClientMock()
    content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => pointers.map(generateEntity))
    entitiesFetcher = await createFetcher(content)
    await entitiesFetcher.fetchEntities(urns)
    ;(content.fetchEntitiesByPointers as jest.Mock).mockClear()
    entities = await entitiesFetcher.fetchEntities(urns)
  })

  it('should serve the second call from the cache without requesting anything', () => {
    expect(content.fetchEntitiesByPointers).not.toHaveBeenCalled()
  })

  it('should still return every entity', () => {
    expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
  })
})

describe('when the content server returns an entity without metadata', () => {
  let urns: string[]
  let entities: (Entity | undefined)[]

  beforeEach(async () => {
    urns = ['urn:wearable:0', 'urn:wearable:1']
    content = createContentClientMock()
    content.fetchEntitiesByPointers = jest.fn(async () => [
      generateEntity('urn:wearable:0'),
      { ...generateEntity('urn:wearable:1'), metadata: undefined }
    ])
    entitiesFetcher = await createFetcher(content)
    entities = await entitiesFetcher.fetchEntities(urns)
  })

  it('should still return the entities that could be keyed by urn', () => {
    expect(entities[0]?.metadata.id).toBe('urn:wearable:0')
  })

  it('should report the unusable entity as a miss instead of failing the request', () => {
    expect(entities[1]).toBeUndefined()
  })
})
