import { Emote, EntityType, Wearable } from "@dcl/schemas"
import { createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createLogComponent } from "@well-known-components/logger"
import { createEmoteDefinitionsFetcherComponent, createWearableDefinitionsFetcherComponent } from "../../../src/adapters/definitions-fetcher"
import { createContentComponentMock } from "../../mocks/content-mock"

it('wearables are fetched and mapped to WearableDefinition', async () => {
  const contentMock = createContentComponentMock()
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
  contentMock.getExternalContentServerUrl = jest.fn().mockReturnValue('baseUrl')
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent(
    { config, logs, content: contentMock }
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
  const contentMock = createContentComponentMock()
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
  contentMock.getExternalContentServerUrl = jest.fn().mockReturnValue('baseUrl')
  const emoteDefinitionsFetcher = await createEmoteDefinitionsFetcherComponent(
    { config, logs, content: contentMock }
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
  const contentMock = createContentComponentMock()
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
  contentMock.getExternalContentServerUrl = jest.fn().mockReturnValue('baseUrl')
  const wearableDefinitionsFetcher = await createWearableDefinitionsFetcherComponent(
    { config, logs, content: contentMock }
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
