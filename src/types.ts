import type { IFetchComponent } from '@well-known-components/http-server'
import type {
  IConfigComponent,
  ILoggerComponent,
  IHttpServerComponent,
  IBaseComponent,
  IMetricsComponent
} from '@well-known-components/interfaces'
import { metricDeclarations } from './metrics'
import { TheGraphComponent } from './ports/the-graph'
import { Profile, IPFSv1, IPFSv2, I18N } from '@dcl/schemas'
import { ContentComponent } from './ports/content'
import { OwnershipCachesComponent } from './ports/ownership-caches'
import { Variables } from '@well-known-components/thegraph-component'
import { EmotesCachesComponent } from './ports/emotes-caches'
import { WearablesComponent } from './ports/wearables-component'
import { ThirdPartyWearablesComponent } from './ports/tp-component'
import { DefinitionsComponent } from './ports/definitions-component'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  logs: ILoggerComponent
  server: IHttpServerComponent<GlobalContext>
  fetch: IFetchComponent
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  content: ContentComponent
  theGraph: TheGraphComponent
  ownershipCaches: OwnershipCachesComponent
  thirdPartyComponent: ThirdPartyWearablesComponent
  wearablesComponent: WearablesComponent
  definitions: DefinitionsComponent
  emotesCaches: EmotesCachesComponent
}

// components used in runtime
export type AppComponents = BaseComponents & {
  statusChecks: IBaseComponent
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
}

// this type simplifies the typings of http handlers
export type HandlerContextWithPath<
  ComponentNames extends keyof AppComponents,
  Path extends string = any
> = IHttpServerComponent.PathAwareContext<
  IHttpServerComponent.DefaultContext<{
    components: Pick<AppComponents, ComponentNames>
  }>,
  Path
>

export type Context<Path extends string = any> = IHttpServerComponent.PathAwareContext<GlobalContext, Path>

export type Pagination = {
  pageSize: number | undefined
  pageNum: number | undefined
  orderBy: string | undefined
}

export type Filename = string
export type Filehash = IPFSv1 | IPFSv2
export type WearableId = string // These ids are used as pointers on the content server
export type Name = string

export type ProfileMetadata = Profile & {
  timestamp: number
}

export interface NFTsOwnershipChecker {
  addNFTsForAddress: (address: string, nfts: string[]) => void
  checkNFTsOwnership: () => void
  getOwnedNFTsForAddress: (address: string) => string[]
}

export interface TPWResolver {
  findThirdPartyAssetsByOwner: (owner: string) => Promise<ThirdPartyAsset[]>
}

export type ThirdPartyAsset = {
  id: string
  amount: number
  urn: {
    decentraland: string
  }
}

export type ThirdPartyAssets = {
  address: string
  total: number
  page: number
  assets: ThirdPartyAsset[]
  next?: string
}

/**
 * Function used to fetch TheGraph
 * @public
 */
export type QueryGraph = <T = any>(query: string, variables?: Variables, remainingAttempts?: number) => Promise<T>

export type CategoryResponse = {
  nfts: {
    category: string
  }[]
}

export type UrnAndAmount = {
  urn: string
  amount: number
}

export type CachedWearable = {
  urn: string
  amount: number
  individualData?: {
    id: string
    tokenId?: string
    transferredAt?: number
    price?: number
  }[]
  rarity: string
}

export type CachedThirdPartyWearable = {
  urn: string
  amount: number
  individualData?: {
    id: string
    tokenId?: string
    transferredAt?: number
    price?: number
  }[]
}

// The response is grouped by URN
export type WearableForResponse = {
  urn: string
  amount: number
  individualData?: {
    id: string
    tokenId?: string
    transferredAt?: number
    price?: number
  }[]
  definition?: Definition
}

export type Definition = {
  id: string
  description: string
  image: string
  thumbnail: string
  collectionAddress: string
  rarity: string
  createdAt: number
  updatedAt: number
  data: {
    replaces: string[]
    hides: string[]
    tags: string[]
    category: string
    representations: Representation[]
  }
  i18n: I18N[]
}

type Representation = {
  bodyShapes: string[]
  mainFile: string
  overrideReplaces: string[]
  overrideHides: string[]
  contents: Content[]
}

type Content = {
  key: string
  url: string
}

export interface EmotesQueryResponse {
  nfts: EmoteFromQuery[]
}

export type EmoteFromQuery = {
  urn: string
  id: string
  contractAddress: string
  tokenId: string
  image: string
  transferredAt: number
  item: {
    metadata: {
      emote: {
        name: string
        description: string
      }
    }
    rarity: string
    price: number
  }
}

export type EmoteForResponse = {
  urn: string
  id?: string
  contractAddress?: string
  tokenId?: string
  image?: string
  transferredAt?: number
  name?: string
  description?: string
  rarity?: string
  price?: number
  amount: number
}

export interface NamesQueryResponse {
  nfts: NameFromQuery[]
}

export type NameFromQuery = {
  name: string
  contractAddress: string
  tokenId: string
  activeOrder: {
    price: string
  }
}

export type NameForResponse = {
  name: string
  contractAddress: string
  tokenId: string
  price: string | null
}

export interface LandsQueryResponse {
  nfts: LandFromQuery[]
}

export type LandFromQuery = {
  name: string
  contractAddress: string
  tokenId: string
  category: string
  parcel: {
    x: string
    y: string
    data: {
      description: string
    }
  }
  estate: {
    data: {
      description: string
    }
  }
  activeOrder: {
    price: string
  }
  image: string
}

export type LandForResponse = {
  name: string
  contractAddress: string
  tokenId: string
  category: string
  x?: string
  y?: string
  description: string | undefined
  price: string | null
  image: string
}

export type ThirdPartyProvider = {
  id: string
  resolver: string
}
