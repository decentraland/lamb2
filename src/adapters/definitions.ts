import { EmoteCategory, EmoteDefinition, Entity, WearableDefinition } from '@dcl/schemas'
import { AppComponents } from '../types'

export function extractWearableDefinitionFromEntity(
  components: Pick<AppComponents, 'contentServerUrl'>,
  entity: Entity
): WearableDefinition {
  const metadata = entity.metadata
  const representations = metadata.data.representations.map((representation: any) =>
    mapRepresentation(components, representation, entity)
  )
  const externalImage = createExternalContentUrl(components, entity, metadata.image)
  const thumbnail = createExternalContentUrl(components, entity, metadata.thumbnail)!
  const image = externalImage ?? metadata.image

  return {
    ...metadata,
    thumbnail,
    image,
    data: {
      ...metadata.data,
      representations
    }
  }
}

function mapRepresentation<T>(
  components: Pick<AppComponents, 'contentServerUrl'>,
  metadataRepresentation: T & { contents: string[] },
  entity: Entity
): T & { contents: { key: string; url: string }[] } {
  const newContents = metadataRepresentation.contents.map((fileName) => ({
    key: fileName,
    url: createExternalContentUrl(components, entity, fileName)!
  }))
  return {
    ...metadataRepresentation,
    contents: newContents
  }
}

function createExternalContentUrl(
  components: Pick<AppComponents, 'contentServerUrl'>,
  entity: Entity,
  fileName: string | undefined
): string | undefined {
  const hash = findHashForFile(entity, fileName)
  if (hash) {
    return components.contentServerUrl + `/contents/` + hash
  }
  return undefined
}

function findHashForFile(entity: Entity, fileName: string | undefined) {
  if (fileName) {
    return entity.content?.find((item) => item.file === fileName)?.hash
  }
  return undefined
}

export function extractEmoteDefinitionFromEntity(
  components: Pick<AppComponents, 'contentServerUrl'>,
  entity: Entity
): EmoteDefinition {
  const metadata = entity.metadata

  // Extract data depending on if it is a new emote or and old one
  let extractedMetadata = metadata
  let emoteDataADR74
  if ('emoteDataADR74' in metadata) {
    const representations = metadata.emoteDataADR74.representations.map((representation: any) =>
      mapRepresentation(components, representation, entity)
    )
    emoteDataADR74 = {
      ...metadata.emoteDataADR74,
      representations
    }
  } else {
    const { data, emoteDataV0, ...restOfMetadata } = metadata as any
    const representations = metadata.data.representations.map((representation: any) =>
      mapRepresentation(components, representation, entity)
    )
    extractedMetadata = restOfMetadata
    emoteDataADR74 = {
      category: EmoteCategory.DANCE,
      tags: metadata.data.tags,
      loop: 'emoteDataV0' in metadata ? (metadata as any).emoteDataV0.loop : false,
      representations
    }
  }

  const externalImage = createExternalContentUrl(components, entity, metadata.image)
  const thumbnail = createExternalContentUrl(components, entity, metadata.thumbnail)!
  const image = externalImage ?? metadata.image

  return {
    ...extractedMetadata,
    thumbnail,
    image,
    emoteDataADR74
  }
}
