import { Entity, EntityType, Wearable, WearableCategory, WearableRepresentation } from '@dcl/schemas'
import { WearableFromQuery } from '../../src/logic/fetch-elements/fetch-items'
import { BaseWearable, ThirdPartyProvider, ThirdPartyAsset } from '../../src/types'
import { BASE_WEARABLES } from '../../src/logic/fetch-elements/fetch-base-items'

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

const timestamp = Date.now() - TWO_DAYS

export function generateBaseWearables(quantity: number): BaseWearable[] {
  const generatedWearables: BaseWearable[] = []
  for (let i = 0; i < quantity; i++) {
    const urn = BASE_WEARABLES[i]
    generatedWearables.push({
      urn,
      amount: 1,
      individualData: [
        {
          id: urn
        }
      ],
      name: urn,
      category: WearableCategory.BODY_SHAPE,
      entity: generateWearableEntities([urn])[0]
    })
  }

  return generatedWearables
}

export function generateWearables(quantity: number): WearableFromQuery[] {
  const generatedWearables = []
  for (let i = 0; i < quantity; i++) {
    generatedWearables.push({
      urn: 'urn-' + i,
      id: 'id-' + i,
      tokenId: 'tokenId-' + i,
      category: 'wearable',
      transferredAt: Date.now() - TWO_DAYS + i,
      metadata: {
        wearable: {
          name: 'name-' + i,
          category: WearableCategory.EYEWEAR
        }
      },
      item: {
        rarity: 'unique',
        price: 100 + i
      }
    })
  }

  return generatedWearables
}

const imageFileNameFor = (urn: string) => `imageFor${urn}`
const thumbnailNameFor = (urn: string) => `thumbnailFor${urn}`

export function generateWearableEntity(urn: string): Entity {
  return {
    version: '1',
    id: urn,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp,
    content: [
      {
        file: 'file',
        hash: 'id'
      },
      {
        file: imageFileNameFor(urn),
        hash: 'imageHash'
      },
      {
        file: thumbnailNameFor(urn),
        hash: 'thumbnailHash'
      }
    ],
    metadata: {
      id: urn,
      name: `nameFor${urn}`,
      description: `descFor${urn}`,
      i18n: [],
      thumbnail: thumbnailNameFor(urn),
      image: imageFileNameFor(urn),
      data: {
        tags: ['aTag'],
        category: WearableCategory.EARRING,
        representations: [
          {
            bodyShapes: [],
            mainFile: `mainFileFor${urn}`,
            contents: ['fileName'],
            overrideHides: [],
            overrideReplaces: []
          }
        ] as WearableRepresentation[]
      }
    } as Wearable
  }
}

export function generateWearableEntities(urns: string[]): Entity[] {
  return urns.map(generateWearableEntity)
}

export function generateThirdPartyWearables(quantity: number): ThirdPartyAsset[] {
  const generatedThirdPartyWearables = []
  for (let i = 0; i < quantity; i++) {
    generatedThirdPartyWearables.push({
      id: 'id-' + i,
      amount: 1,
      urn: {
        decentraland: 'urn-tp-' + i
      }
    })
  }
  return generatedThirdPartyWearables
}

export function getThirdPartyProviders(): ThirdPartyProvider[] {
  return [
    {
      id: 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin',
      resolver: 'https://decentraland-api.babydoge.com/v1',
      metadata: {
        thirdParty: {
          name: 'baby doge coin',
          description: 'baby doge coin'
        }
      }
    },
    {
      id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars',
      resolver: 'https://api.cryptoavatars.io/',
      metadata: {
        thirdParty: {
          name: 'crypto avatars',
          description: 'avatars'
        }
      }
    },
    {
      id: 'urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip',
      resolver: 'https://wearables-api.unxd.com',
      metadata: {
        thirdParty: {
          name: 'disco',
          description: 'disco'
        }
      }
    }
  ]
}
