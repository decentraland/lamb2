import { Entity } from "@dcl/schemas"
import { AppComponents } from "../types"

export function extractDefinitionFromEntity(components: Pick<AppComponents, 'content'>, entity: Entity) {
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
  components: Pick<AppComponents, 'content'>,
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

function createExternalContentUrl(components: Pick<AppComponents, 'content'>,
  entity: Entity,
  fileName: string | undefined
): string | undefined {
  const hash = findHashForFile(entity, fileName)
  if (hash)
    return components.content.getExternalContentServerUrl() + `/contents/` + hash
  return undefined
}

function findHashForFile(entity: Entity, fileName: string | undefined) {
  if (fileName)
    return entity.content?.find((item) => item.file === fileName)?.hash
  return undefined
}
