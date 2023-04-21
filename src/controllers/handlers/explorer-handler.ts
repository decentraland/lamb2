import { WearableCategory, WearableDefinition } from '@dcl/schemas'
import { ElementsFetcher, FetcherError } from '../../adapters/elements-fetcher'
import { fetchAndPaginate, paginationObject } from '../../logic/pagination'
import {
  BaseWearableFilters,
  ErrorResponse,
  HandlerContextWithPath,
  Item,
  PaginatedResponse,
  ThirdPartyWearable,
  WearableFilters,
  WearableType
} from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BaseItem } from '../../logic/fetch-elements/fetch-base-items'

type BaseAvatar = {
  urn: string
  amount: 1
  individualData: {
    id: string // VA LA URN O NADA
  }[]
}

type ItemResponse = (BaseAvatar | Omit<Item, 'minTransferredAt' | 'maxTransferredAt'> | ThirdPartyWearable) & {
  type: WearableType
  definition: WearableDefinition | undefined
}

const mapItemToItemResponse = (
  item: BaseAvatar | Omit<Item, 'minTransferredAt' | 'maxTransferredAt'> | ThirdPartyWearable,
  definitions: WearableDefinition | undefined
): ItemResponse => ({
  type: 'on-chain', // TODO
  urn: item.urn,
  amount: item.individualData.length,
  individualData: item.individualData,
  name: '', //item.name,
  category: WearableCategory.EYEWEAR, //item.category,
  rarity: '', //item.rarity,
  definition: definitions
})

function createFilters(params: IHttpServerComponent.ParseUrlParams<'/explorer-service/backpack/:address/wearables'>) {
  const baseFilter = (wearables: Item[], filters: BaseWearableFilters) => {
    return wearables
  }

  const onChainFilter = (wearables: Item[], filters: WearableFilters) => {
    return wearables
  }

  const thirdPartyFilter = (wearables: ThirdPartyWearable[], filters: BaseWearableFilters) => {
    return wearables
  }

  return { baseFilter, onChainFilter, thirdPartyFilter }
}

function createCombinedFetcher(
  baseWearablesFetcher: ElementsFetcher<BaseItem>,
  wearablesFetcher: ElementsFetcher<Item>,
  thirdPartyWearablesFetcher: ElementsFetcher<ThirdPartyWearable>
): (address: string) => Promise<Item[]> {
  return async function (address: string): Promise<Item[]> {
    const [baseItems, nftItems, thirdPartyItems] = await Promise.all([
      baseWearablesFetcher.fetchOwnedElements(address),
      wearablesFetcher.fetchOwnedElements(address),
      thirdPartyWearablesFetcher.fetchOwnedElements(address)
    ])

    return [/*...baseItems, */ ...nftItems /*, ...thirdPartyItems*/]
  }
}

export async function explorerHandler(
  context: HandlerContextWithPath<
    | 'logs'
    | 'baseWearablesFetcher'
    | 'wearablesFetcher'
    | 'thirdPartyProvidersFetcher'
    | 'thirdPartyWearablesFetcher'
    | 'wearableDefinitionsFetcher',
    '/explorer-service/backpack/:address/wearables'
  >
): Promise<PaginatedResponse<ItemResponse> | ErrorResponse> {
  const {
    logs,
    baseWearablesFetcher,
    wearablesFetcher,
    thirdPartyProvidersFetcher,
    thirdPartyWearablesFetcher,
    wearableDefinitionsFetcher
  } = context.components
  const { address } = context.params
  const logger = logs.getLogger('wearables-handler')
  const pagination = paginationObject(context.url)

  try {
    // const { baseFilter,  onChainFilter, thirdPartyFilter } = createFilters(context.params)
    // sortSpecific = createSort(context.params)
    // const onChainWearables = onChainFilter(wearablesFetcher.fetchOwnedElements(address), onChainFilter)
    // const baseWearables = baseFilter(baseWearablesFetcher.fetchOwnedElements(address), baseFilters)
    // const thirdPartyWearables = thirdPartyFilter(thirdPartyFetcher.fetchOwnedElements(address), thirdPartyFiltrs)

    const fetchCombinedElements = createCombinedFetcher(
      baseWearablesFetcher,
      wearablesFetcher,
      thirdPartyWearablesFetcher
    )
    const page = await fetchAndPaginate<Item>(address, fetchCombinedElements, pagination, undefined, undefined)

    const definitions: (WearableDefinition | undefined)[] = await wearableDefinitionsFetcher.fetchItemsDefinitions(
      page.elements.map((wearable) => wearable.urn)
    )

    const results: ItemResponse[] = []
    const wearables = page.elements

    for (let i = 0; i < wearables.length; ++i) {
      results.push(mapItemToItemResponse(wearables[i], definitions[i] || undefined))
    }

    return {
      status: 200,
      body: {
        ...page,
        elements: results
      }
    }
  } catch (err: any) {
    if (err instanceof FetcherError) {
      return {
        status: 502,
        body: {
          error: 'Cannot fetch wearables right now'
        }
      }
    }
    logger.error(err)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error'
      }
    }
  }
}

const mock = {
  status: 200,
  body: {
    elements: [
      {
        type: 'base-wearable',
        urn: 'urn:decentraland:off-chain:base-avatars:mouth_02',
        amount: 1,
        individualData: [
          {
            id: 'urn:decentraland:off-chain:base-avatars:mouth_02'
          }
        ],
        definition: {
          version: 'v3',
          id: 'bafkreiealbrk6jfm73e4tptl6mkqohrvn45pgq4aowiusfaxdxted3unf4',
          type: 'wearable',
          pointers: [],
          timestamp: 1660254489672,
          content: [],
          metadata: {
            id: 'urn:decentraland:off-chain:base-avatars:mouth_02',
            description: '',
            thumbnail: 'thumbnail.png',
            rarity: 'common',
            data: {
              tags: ['face', 'mouth', 'male', 'man', 'base-wearable'],
              category: 'mouth',
              representations: [
                {
                  bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                  mainFile: 'M_Mouth_02.png',
                  overrideReplaces: [],
                  overrideHides: [],
                  contents: ['M_Mouth_02.png']
                }
              ],
              replaces: [],
              hides: []
            },
            i18n: [
              {
                code: 'en',
                text: 'Mouth_02'
              },
              {
                code: 'es',
                text: 'Mouth_02'
              }
            ],
            createdAt: 1622143003105,
            updatedAt: 1622143003105,
            image: 'thumbnail.png',
            name: 'Mouth_02',
            collectionAddress: '0x0000000000000000000000000000000000000000'
          }
        }
      },
      {
        type: 'third-party',
        urn: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:0x28ccbe824455a3b188c155b434e4e628babb6ffa:4478',
        individualData: [
          {
            id: '0x28ccbe824455a3b188c155b434e4e628babb6ffa:4478'
          }
        ],
        amount: 1,
        definition: {
          id: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:0x28ccbe824455a3b188c155b434e4e628babb6ffa:4478',
          name: 'The User #4478',
          description: 'The User Collection skin from CryptoAvatars',
          i18n: [
            {
              code: 'en',
              text: 'The User #4478'
            }
          ],
          data: {
            replaces: [],
            hides: ['earring', 'eyewear', 'hat', 'helmet', 'mask', 'tiara', 'top_head'],
            tags: ['The User Collection', 'CryptoAvatars'],
            category: 'skin',
            representations: [
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                mainFile: 'male/4478.glb',
                contents: [
                  {
                    key: 'male/4478.glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/bafybeice6bvz3hccjtpeawkr5erfonpaxbtbho5wduijkk4zxfitgzmcka'
                  }
                ],
                overrideHides: [],
                overrideReplaces: []
              },
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                mainFile: 'female/4478.glb',
                contents: [
                  {
                    key: 'female/4478.glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/bafybeice6bvz3hccjtpeawkr5erfonpaxbtbho5wduijkk4zxfitgzmcka'
                  }
                ],
                overrideHides: [],
                overrideReplaces: []
              }
            ]
          },
          image:
            'https://peer-testing-3.decentraland.org/content/contents/bafkreigw4f6wcdsegedl5n7k6hy72ivmeiypvshy6unwd552fabxzyvu4i',
          thumbnail:
            'https://peer-testing-3.decentraland.org/content/contents/bafkreicvlcre2dvy44vqk6bri4othslphf67pj56qfdhv2cxon2nszm55u',
          metrics: {
            triangles: 0,
            materials: 0,
            meshes: 0,
            bodies: 0,
            entities: 0,
            textures: 0
          },
          content: {
            'thumbnail.png': 'bafkreicvlcre2dvy44vqk6bri4othslphf67pj56qfdhv2cxon2nszm55u',
            'male/4478.glb': 'bafybeice6bvz3hccjtpeawkr5erfonpaxbtbho5wduijkk4zxfitgzmcka',
            'female/4478.glb': 'bafybeice6bvz3hccjtpeawkr5erfonpaxbtbho5wduijkk4zxfitgzmcka',
            'image.png': 'bafkreigw4f6wcdsegedl5n7k6hy72ivmeiypvshy6unwd552fabxzyvu4i'
          },
          merkleProof: {
            index: 2596,
            proof: [
              '0x4ef3dd8d656d03e8d591e62fbe2d8bd459563ebbb4b8413a2fe17d7f7e33e3c4',
              '0xf64edbc204c4962174c439923b4798ed9a6c581f717d21143862576fb74166d8',
              '0xdde016092d6ae931fe7f9b9cc66a888bd2fe78ea5096c0e6afd5066d8b2e1b91',
              '0x7a914204435658e01a716c6cc1ea7c072b1691bf3af0acfa07c327602bea230b',
              '0xc9585c6db9e76bf04a769939f95748d2b5bed7971fecee4aec767c60987960f9',
              '0xbf2d654ad8f7da50cd61cfe0f0167f2cefe66c3df7bfba5844886e60d8ded993',
              '0x12d56b6496f8323ace870fb001df8bdc75f05e3893eb12960a4ca75f32eef652',
              '0x443fb4ffe68f9339d3c9fa554015c1fe5cb29a994f62d2865264da0af3672cfb',
              '0x2000d672bb5e74d69df4856d1afed597169b37b225983ed4c3ba91e0c54d7208',
              '0xda8ed15d2b96f43e5d37dfbd6dde88786d656ed6526e46f859d093937182230a',
              '0x32dd7efae1e128f6a6ddeec183b56ad30627071d592a1a91b141467db16af37d',
              '0xec729cab4e4358d53790e6ff651eac7c8e780ace36df85e32978202561d6f76c',
              '0x20f403d5c2a3cd9420e74cc7cf33baf1410572359f6b2964125a3c8228e82a2b'
            ],
            hashingKeys: ['id', 'name', 'description', 'i18n', 'data', 'image', 'thumbnail', 'metrics', 'content'],
            entityHash: '8622e3a16df11834c889ec7e694a9b63e4ca3e862dfeb3bc16f135160b777f91'
          }
        }
      },
      {
        type: 'on-chain',
        urn: 'urn:decentraland:matic:collections-v2:0x25bb3d2856169248b4a21dd7500eed156e5e893b:0',
        individualData: [
          {
            id: '0x25bb3d2856169248b4a21dd7500eed156e5e893b-1',
            tokenId: '1',
            transferredAt: '1639526638',
            price: '1000000000000000000000000000000000'
          }
        ],
        amount: 1,
        definition: {
          id: 'urn:decentraland:matic:collections-v2:0x25bb3d2856169248b4a21dd7500eed156e5e893b:0',
          name: 'HirotoKai x PB head',
          description: '',
          collectionAddress: '0x25bb3d2856169248b4a21dd7500eed156e5e893b',
          type: 'on-chain',
          i18n: [
            {
              code: 'en',
              text: 'HirotoKai x PB head'
            }
          ],
          data: {
            replaces: [],
            hides: ['head'],
            tags: [],
            category: 'helmet',
            representations: [
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                mainFile: 'male/PBHead (1).glb',
                contents: [
                  {
                    key: 'male/PBHead (1).glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/QmZe1Xr9AdrxHjvVgeBSnQdXXQAB52cq1DNb5GN8s7wL8H'
                  }
                ],
                overrideHides: ['head'],
                overrideReplaces: []
              },
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                mainFile: 'female/PBHead (1).glb',
                contents: [
                  {
                    key: 'female/PBHead (1).glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/QmZe1Xr9AdrxHjvVgeBSnQdXXQAB52cq1DNb5GN8s7wL8H'
                  }
                ],
                overrideHides: ['head'],
                overrideReplaces: []
              }
            ]
          },
          image:
            'https://peer-testing-3.decentraland.org/content/contents/QmUrz6qyWXf8SEzu6aKuNfEZd9T8PYYRQF8NGTQgQ6nLCW',
          thumbnail:
            'https://peer-testing-3.decentraland.org/content/contents/QmNwv36ZZHeEBEhjxgmSgXxcGmJne3nQeGkx8e97NDsriq',
          metrics: {
            triangles: 560,
            materials: 1,
            textures: 2,
            meshes: 1,
            bodies: 1,
            entities: 1
          }
        }
      },
      {
        type: 'on-chain',
        urn: 'urn:decentraland:ethereum:collections-v1:community_contest:cw_fox_top_head',
        individualData: [
          {
            id: '0x32b7495895264ac9d0b12d32afd435453458b1c6-2901',
            tokenId: '2901',
            transferredAt: '1657156292',
            price: '0'
          }
        ],
        rarity: 'mythic',
        amount: 1,
        definition: {
          id: 'urn:decentraland:ethereum:collections-v1:community_contest:cw_fox_top_head',
          description: '',
          image:
            'https://peer-testing-3.decentraland.org/content/contents/QmdA3uZZpHQJXYhbdMqWsWVEhK5ouG1HRQB8MeAyapxSp1',
          thumbnail:
            'https://peer-testing-3.decentraland.org/content/contents/QmZ8We9m4WnpFHaUGNwHvjzFurfHNQic6ccskgQPDjThgk',
          collectionAddress: '0x32b7495895264ac9d0b12d32afd435453458b1c6',
          rarity: 'mythic',
          data: {
            replaces: ['helmet', 'hat'],
            hides: [],
            tags: [
              'accesories',
              'top_head',
              'exclusive',
              'launch',
              '20.02.20',
              'decentraland',
              'community',
              'wearables',
              'exclusive'
            ],
            category: 'top_head',
            representations: [
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseMale'],
                mainFile: 'Top_Head_FoxHat.glb',
                overrideReplaces: [],
                overrideHides: [],
                contents: [
                  {
                    key: 'T_Fox001.png',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/Qmadbr2extgpWcH1yg5qbQ6V3PZejCMarDhwVB4m2pZpJZ'
                  },
                  {
                    key: 'Top_Head_FoxHat.glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/QmQrExKCfMWJaqXpSjF5StNaCZByaGXPUXwJkZks7CyLyn'
                  }
                ]
              },
              {
                bodyShapes: ['urn:decentraland:off-chain:base-avatars:BaseFemale'],
                mainFile: 'Top_Head_FoxHat.glb',
                overrideReplaces: [],
                overrideHides: [],
                contents: [
                  {
                    key: 'T_Fox001.png',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/Qmadbr2extgpWcH1yg5qbQ6V3PZejCMarDhwVB4m2pZpJZ'
                  },
                  {
                    key: 'Top_Head_FoxHat.glb',
                    url: 'https://peer-testing-3.decentraland.org/content/contents/QmQrExKCfMWJaqXpSjF5StNaCZByaGXPUXwJkZks7CyLyn'
                  }
                ]
              }
            ]
          },
          i18n: [
            {
              code: 'en',
              text: 'Fox Hat'
            },
            {
              code: 'es',
              text: 'Sombrero de Zorro'
            }
          ],
          createdAt: 1637005680453,
          updatedAt: 1637005680453
        }
      }
    ],
    totalAmount: 4,
    pageNum: 1,
    pageSize: 4
  }
}
