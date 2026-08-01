import { Entity, EntityType } from '@dcl/schemas'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createLogComponent } from '@well-known-components/logger'
import { createEntitiesFetcherComponent } from '../../../src/adapters/entities-fetcher'
import { createContentClientMock } from '../../mocks/content-mock'

// Keep in sync with MAX_POINTERS_PER_REQUEST in src/adapters/entities-fetcher.ts
const MAX_POINTERS_PER_REQUEST = 500

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

async function createFetcher(content: ReturnType<typeof createContentClientMock>) {
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const fetch = { fetch: jest.fn() }

  return createEntitiesFetcherComponent({
    config,
    logs,
    content,
    internalContentServerUrl: 'internalContentServerUrl',
    fetch
  })
}

it('fetches entities in a single request when under the pointers limit', async () => {
  const urns = Array.from({ length: 10 }, (_, i) => `urn:wearable:${i}`)
  const content = createContentClientMock()
  content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => pointers.map(generateEntity))

  const entitiesFetcher = await createFetcher(content)
  const entities = await entitiesFetcher.fetchEntities(urns)

  expect(content.fetchEntitiesByPointers).toHaveBeenCalledTimes(1)
  expect(content.fetchEntitiesByPointers).toHaveBeenCalledWith(urns)
  expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
})

it('splits the request in batches when over the pointers limit, so the content server does not reject it', async () => {
  // A wallet owning this many items used to produce a single request the content server
  // answered with 400 (`pointers` maxItems is 1000), which surfaced as a 500 to the client.
  const urns = Array.from({ length: 1939 }, (_, i) => `urn:wearable:${i}`)
  const content = createContentClientMock()
  content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => {
    if (pointers.length > 1000) {
      throw new Error('Invalid JSON body: pointers must NOT have more than 1000 items')
    }
    return pointers.map(generateEntity)
  })

  const entitiesFetcher = await createFetcher(content)
  const entities = await entitiesFetcher.fetchEntities(urns)

  expect(content.fetchEntitiesByPointers).toHaveBeenCalledTimes(Math.ceil(urns.length / MAX_POINTERS_PER_REQUEST))
  for (const call of (content.fetchEntitiesByPointers as jest.Mock).mock.calls) {
    expect(call[0].length).toBeLessThanOrEqual(MAX_POINTERS_PER_REQUEST)
  }

  // Every urn is resolved, in the requested order, with no duplicates or holes
  expect(entities).toHaveLength(urns.length)
  expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
})

it('only requests the urns missing from the cache', async () => {
  const urns = Array.from({ length: 600 }, (_, i) => `urn:wearable:${i}`)
  const content = createContentClientMock()
  content.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => pointers.map(generateEntity))

  const entitiesFetcher = await createFetcher(content)
  await entitiesFetcher.fetchEntities(urns)
  ;(content.fetchEntitiesByPointers as jest.Mock).mockClear()

  const entities = await entitiesFetcher.fetchEntities(urns)

  expect(content.fetchEntitiesByPointers).not.toHaveBeenCalled()
  expect(entities.map((entity) => entity?.metadata.id)).toEqual(urns)
})

it('skips entities without a metadata id instead of failing the whole request', async () => {
  const urns = ['urn:wearable:0', 'urn:wearable:1']
  const content = createContentClientMock()
  content.fetchEntitiesByPointers = jest.fn(async () => [
    generateEntity('urn:wearable:0'),
    { ...generateEntity('urn:wearable:1'), metadata: undefined }
  ])

  const entitiesFetcher = await createFetcher(content)
  const entities = await entitiesFetcher.fetchEntities(urns)

  expect(entities[0]?.metadata.id).toBe('urn:wearable:0')
  expect(entities[1]).toBeUndefined()
})
