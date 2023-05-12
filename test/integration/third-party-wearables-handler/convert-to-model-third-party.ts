import { Entity, Wearable } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../../src/adapters/definitions'
import { ThirdPartyWearableResponse } from '../../../src/controllers/handlers/third-party-wearables-handler'
import { ContentComponent } from '../../../src/ports/content'
import { ThirdPartyAsset } from '../../../src/types'

type ContentInfo = {
  entities: Entity[]
  content: ContentComponent
}

export function convertToThirdPartyWearableResponse(
  wearables: ThirdPartyAsset[],
  contentInfo: ContentInfo,
  includeDefinitions: boolean = false
): ThirdPartyWearableResponse[] {
  return wearables.map((wearable): ThirdPartyWearableResponse => {
    const entity = contentInfo.entities.find((entity) => entity.id === wearable.urn.decentraland)
    const content = contentInfo?.content
    const wearableMetadata: Wearable = entity?.metadata
    return {
      amount: wearable.amount,
      individualData: [
        {
          id: wearable.id
        }
      ],
      urn: wearable.urn.decentraland,
      name: wearableMetadata.name,
      category: wearableMetadata.data.category,
      entity,
      definition: includeDefinitions ? extractWearableDefinitionFromEntity({ content }, entity) : undefined
    }
  })
}
