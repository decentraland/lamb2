import { Emote, Entity, EntityType, Wearable, WearableDefinition } from "@dcl/schemas"
import { createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createLogComponent } from "@well-known-components/logger"
import { createEmoteDefinitionsFetcherComponent, createWearableDefinitionsFetcherComponent } from "../../../src/adapters/definitions-fetcher"
import { createContentClientMock } from "../../mocks/content-mock"

function buildWearableEntity(urn: string): Entity {
  return {
    version: 'v3',
    id: `entity-${urn}`,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: 0,
    content: [{ file: 'thumbnail.png', hash: 'thumbnailId' }],
    metadata: {
      id: urn,
      data: { tags: [], representations: [{ contents: ['thumbnail.png'] }] },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Wearable
  }
}

it('wearables are fetched and mapped to WearableDefinition', async () => {
  const contentMock = createContentClientMock()
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const urn = 'urn:wearable:0'
  const entityId = 'entity-id'
  const wearable = {
    version: '1',
    id: entityId,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: Date.now(),
    content: [
      { file: 'filename.png', hash: 'fileId' },
      { file: 'thumbnail.png', hash: 'thumbnailId' },
      { file: 'image.png', hash: 'imageId' }
    ],
    metadata: {
      id: urn,
      data: {
        tags: ['aTag'],
        representations: [{ contents: ['filename.png'] }]
      },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Wearable
  }
  contentMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue([wearable])
  const contentServerUrl = 'baseUrl'
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent(
    { config, logs, content: contentMock, contentServerUrl }
  )
  const wearableDefinitions = await wearableDefinitionsFetcher.fetchItemsDefinitions([urn])
  expect(wearableDefinitions[0]).toEqual({
    id: urn,
    data: {
      tags: ['aTag'],
      representations: [
        {
          contents: [{
            key: "filename.png",
            url: 'baseUrl/contents/fileId'
          }]
        }
      ]
    },
    thumbnail: 'baseUrl/contents/thumbnailId',
    image: 'baseUrl/contents/imageId',
    description: 'aDescription'
  })
})

it('emotes are fetched and mapped to EmoteDefinition', async () => {
  const contentMock = createContentClientMock()
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const urn = 'urn:emote:0'
  const entityId = 'entity-id'
  const emote = {
    version: '1',
    id: entityId,
    type: EntityType.EMOTE,
    pointers: [urn],
    timestamp: Date.now(),
    content: [
      { file: 'filename.png', hash: 'fileId' },
      { file: 'thumbnail.png', hash: 'thumbnailId' },
      { file: 'image.png', hash: 'imageId' }
    ],
    metadata: {
      id: urn,
      emoteDataADR74: {
        tags: ['aTag'],
        representations: [{ contents: ['filename.png'] }]
      },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Emote
  }
  contentMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue([emote])
  const contentServerUrl = 'baseUrl'
  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent(
    { config, logs, content: contentMock, contentServerUrl }
  )
  const emoteDefinitions = await emoteDefinitionsFetcher.fetchItemsDefinitions([urn])

  expect(emoteDefinitions[0]).toEqual({
    id: urn,
    emoteDataADR74: {
      tags: ['aTag'],
      representations: [
        {
          contents: [{
            key: "filename.png",
            url: 'baseUrl/contents/fileId'
          }]
        }
      ]
    },
    thumbnail: 'baseUrl/contents/thumbnailId',
    image: 'baseUrl/contents/imageId',
    description: 'aDescription'
  })
})

it('items are cached in lowercase', async () => {
  const contentMock = createContentClientMock()
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const urn = 'urn:wearable:0'
  const entityId = 'entity-id'
  const wearable = {
    version: '1',
    id: entityId,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: Date.now(),
    content: [
      { file: 'filename.png', hash: 'fileId' },
      { file: 'thumbnail.png', hash: 'thumbnailId' },
      { file: 'image.png', hash: 'imageId' }
    ],
    metadata: {
      id: 'UrN:wearable:0',
      data: {
        tags: ['aTag'],
        representations: [{ contents: ['filename.png'] }]
      },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Wearable
  }
  contentMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue([wearable])
  const contentServerUrl = 'baseUrl'
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent(
    { config, logs, content: contentMock, contentServerUrl }
  )
  const wearableDefinitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(['urn:wearable:0'])
  expect(wearableDefinitions[0]).toEqual({
    id: 'UrN:wearable:0',
    data: {
      tags: ['aTag'],
      representations: [
        {
          contents: [{
            key: "filename.png",
            url: 'baseUrl/contents/fileId'
          }]
        }
      ]
    },
    thumbnail: 'baseUrl/contents/thumbnailId',
    image: 'baseUrl/contents/imageId',
    description: 'aDescription'
  })

  const wearableDefinitions2 = await wearableDefinitionsFetcher.fetchItemsDefinitions(['urn:WeaRablE:0'])
  expect(wearableDefinitions2[0]).toEqual({
    id: 'UrN:wearable:0',
    data: {
      tags: ['aTag'],
      representations: [
        {
          contents: [{
            key: "filename.png",
            url: 'baseUrl/contents/fileId'
          }]
        }
      ]
    },
    thumbnail: 'baseUrl/contents/thumbnailId',
    image: 'baseUrl/contents/imageId',
    description: 'aDescription'
  })
})

it('definitions are fetched despite being evicted from cache', async () => {
  const contentMock = createContentClientMock()
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] }, {
    ITEMS_CACHE_MAX_SIZE: '1'
  })
  const urn = 'urn:wearable:0'
  const entityId = 'entity-id'
  const wearable0 = {
    version: '1',
    id: entityId,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: Date.now(),
    content: [
      { file: 'filename.png', hash: 'fileId' },
      { file: 'thumbnail.png', hash: 'thumbnailId' },
      { file: 'image.png', hash: 'imageId' }
    ],
    metadata: {
      id: 'UrN:wearable:0',
      data: {
        tags: ['aTag'],
        representations: [{ contents: ['filename.png'] }]
      },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Wearable
  }
  const wearable1 = {
    version: '1',
    id: entityId,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: Date.now(),
    content: [
      { file: 'filename.png', hash: 'fileId' },
      { file: 'thumbnail.png', hash: 'thumbnailId' },
      { file: 'image.png', hash: 'imageId' }
    ],
    metadata: {
      id: 'UrN:wearable:1',
      data: {
        tags: ['aTag'],
        representations: [{ contents: ['filename.png'] }]
      },
      thumbnail: 'thumbnail.png',
      image: 'image.png',
      description: 'aDescription'
    } as Wearable
  }
  contentMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue([wearable0, wearable1])
  const contentServerUrl = 'baseUrl'
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent(
    { config, logs, content: contentMock, contentServerUrl }
  )
  const wearableDefinitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(['urn:wearable:0', 'urn:wearable:1'])
  expect(wearableDefinitions).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'UrN:wearable:0' }),
    expect.objectContaining({ id: 'UrN:wearable:1' })
  ]))
})

describe('when fetching more urns than the content server pointers limit', () => {
  // Definitions are resolved for every owned item at once, so a wallet above the limit made
  // the content server answer 400 and the request fail as a 500.
  const CONTENT_SERVER_POINTERS_LIMIT = 1000

  let contentMock: ReturnType<typeof createContentClientMock>
  let urns: string[]
  let definitions: (WearableDefinition | undefined)[]
  let requestedPointers: string[][]

  beforeEach(async () => {
    urns = Array.from({ length: CONTENT_SERVER_POINTERS_LIMIT + 1 }, (_, index) => `urn:wearable:${index}`)
    contentMock = createContentClientMock()
    contentMock.fetchEntitiesByPointers = jest.fn(async (pointers: string[]) => {
      if (pointers.length > CONTENT_SERVER_POINTERS_LIMIT) {
        throw new Error(`Invalid JSON body: pointers must NOT have more than ${CONTENT_SERVER_POINTERS_LIMIT} items`)
      }
      return pointers.map(buildWearableEntity)
    })

    const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent({
      config: await createDotEnvConfigComponent({ path: ['.env.default', '.env'] }),
      logs: await createLogComponent({}),
      content: contentMock,
      contentServerUrl: 'baseUrl'
    })

    definitions = await wearableDefinitionsFetcher.fetchItemsDefinitions(urns)
    requestedPointers = (contentMock.fetchEntitiesByPointers as jest.Mock).mock.calls.map((call) => call[0])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should split the work into batches the content server accepts', () => {
    expect(requestedPointers.length).toBeGreaterThan(1)
    for (const pointers of requestedPointers) {
      expect(pointers.length).toBeLessThanOrEqual(CONTENT_SERVER_POINTERS_LIMIT)
    }
  })

  it('should resolve a definition for every urn, aligned with the requested order', () => {
    expect(definitions.map((definition) => definition?.id)).toEqual(urns)
  })
})
