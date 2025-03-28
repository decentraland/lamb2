import { Entity, Wearable } from '@dcl/schemas'
import { extractWearableDefinitionFromEntity } from '../../../src/adapters/definitions'
import { ThirdPartyWearableResponse } from '../../../src/controllers/handlers/third-party-wearables-handler'

type ContentInfo = {
  entities: Entity[]
  contentServerUrl: string
}

export function convertToThirdPartyWearableResponse(
  wearables: any[],
  contentInfo: ContentInfo,
  includeDefinitions: boolean = false
): (ThirdPartyWearableResponse & { individualData: { id: string; tokenId?: string }[] })[] {
  return wearables.map(
    (wearable): ThirdPartyWearableResponse & { individualData: { id: string; tokenId?: string }[] } => {
      const entity = contentInfo.entities.find((entity) => entity.id === wearable.urn.decentraland)
      const contentServerUrl = contentInfo?.contentServerUrl
      const wearableMetadata: Wearable = entity?.metadata
      return {
        amount: wearable.amount,
        individualData: [
          {
            id: wearable.urn.decentraland + ':' + wearable.urn.tokenId,
            tokenId: wearable.urn.tokenId
          }
        ],
        urn: wearable.urn.decentraland,
        name: wearableMetadata.name,
        category: wearableMetadata.data.category,
        entity,
        definition: includeDefinitions ? extractWearableDefinitionFromEntity({ contentServerUrl }, entity) : undefined
      }
    }
  )
}
