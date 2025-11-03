import { Emote, EmoteCategory, EmoteRepresentationADR74, Entity, EntityType } from '@dcl/schemas'
import { EmoteFromQuery } from '../../src/logic/fetch-elements/fetch-items'

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

export function generateEmotes(quantity: number): EmoteFromQuery[] {
  const generatedEmotes = []
  for (let i = 0; i < quantity; i++) {
    generatedEmotes.push({
      urn: 'urn-' + i,
      id: 'id-' + i,
      tokenId: 'tokenId-' + i,
      transferredAt: Date.now() - TWO_DAYS,
      item: {
        rarity: 'unique',
        price: 100 + i
      },
      category: 'emote' as const,
      metadata: {
        emote: {
          name: 'name-' + i,
          category: EmoteCategory.FUN
        }
      }
    })
  }

  return generatedEmotes
}

const imageFileNameFor = (urn: string) => `imageFor${urn}`
const thumbnailNameFor = (urn: string) => `thumbnailFor${urn}`

export function generateEmoteEntity(urn: string): Entity {
  return {
    version: '1',
    id: urn,
    type: EntityType.EMOTE,
    pointers: [urn],
    timestamp: Date.now() - TWO_DAYS,
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
      emoteDataADR74: {
        representations: [
          {
            bodyShapes: [],
            mainFile: 'mainFile',
            contents: ['fileName']
          }
        ] as EmoteRepresentationADR74[]
      }
    } as Emote
  }
}

export function generateEmoteEntities(quantity: number, urnGenerator?: (index: number) => string): Entity[] {
  const urns = Array.from({ length: quantity }, (_, i) => (urnGenerator ? urnGenerator(i) : `urn-${i}`))
  return urns.map(generateEmoteEntity)
}

export function generateEmoteContentDefinitions(urns: string[]): Entity[] {
  return urns.map((urn) => ({
    version: '1',
    id: urn,
    type: EntityType.EMOTE,
    pointers: ['urn:emote'],
    timestamp: Date.now() - TWO_DAYS,
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
      emoteDataADR74: {
        representations: [
          {
            bodyShapes: [],
            mainFile: 'mainFile',
            contents: ['fileName']
          }
        ] as EmoteRepresentationADR74[]
      }
    } as Emote
  }))
}
