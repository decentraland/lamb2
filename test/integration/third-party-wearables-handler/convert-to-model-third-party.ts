import { Entity, Wearable } from "@dcl/schemas"
import { extractWearableDefinitionFromEntity } from "../../../src/adapters/definitions"
import { ThirdPartyWearableResponse } from "../../../src/controllers/handlers/third-party-wearables-handler"
import { ContentComponent } from "../../../src/ports/content"
import { ThirdPartyAsset } from "../../../src/types"

type ContentInfo = {
  definitions: Entity[],
  content: ContentComponent
}

export function convertToThirdPartyWearableResponse(
  wearables: ThirdPartyAsset[],
  contentInfo: ContentInfo,
  includeDefinitions: boolean = false
): ThirdPartyWearableResponse[] {
  return wearables.map((wearable): ThirdPartyWearableResponse => {
    const definition = contentInfo?.definitions.find((def) => def.id === wearable.urn.decentraland)
    const content = contentInfo?.content
    const wearableMetadata: Wearable = definition?.metadata
    return {
      amount: wearable.amount,
      individualData: [{
        id: wearable.id
      }],
      urn: wearable.urn.decentraland,
      name: wearableMetadata.name,
      category: wearableMetadata.data.category,
      definition: includeDefinitions && definition && content ? extractWearableDefinitionFromEntity({ content }, definition) : undefined
    }
  })
}
