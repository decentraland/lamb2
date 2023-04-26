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
import {
  Profile,
  IPFSv1,
  IPFSv2,
  Wearable,
  WearableRepresentation,
  Emote,
  EmoteRepresentationADR74
} from '@dcl/schemas'
import { ContentComponent } from './ports/content'
import { OwnershipCachesComponent } from './ports/ownership-caches'
import { Variables } from '@well-known-components/thegraph-component'
import { DefinitionsFetcher } from './adapters/definitions-fetcher'
import { WearablesCachesComponent } from './controllers/handlers/old-wearables-handler'
import { ElementsFetcher } from './adapters/elements-fetcher'
import { ThirdPartyProvidersFetcher } from './adapters/third-party-providers-fetcher'
import { HTTPProvider } from 'eth-connect'

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
  wearablesFetcher: ElementsFetcher<Item>
  thirdPartyProvidersFetcher: ThirdPartyProvidersFetcher
  thirdPartyWearablesFetcher: ElementsFetcher<ThirdPartyWearable>
  emotesFetcher: ElementsFetcher<Item>
  emoteDefinitionsFetcher: DefinitionsFetcher<EmoteDefinition>
  wearableDefinitionsFetcher: DefinitionsFetcher<WearableDefinition>
  namesFetcher: ElementsFetcher<Name>
  landsFetcher: ElementsFetcher<LAND>

  ethereumProvider: HTTPProvider

  // old components
  wearablesCaches: WearablesCachesComponent
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

export type Filename = string
export type Filehash = IPFSv1 | IPFSv2
export type WearableId = string // These ids are used as pointers on the content server

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

/**
 * Function used to fetch TheGraph
 * @public
 */
export type QueryGraph = <T = any>(query: string, variables?: Variables, remainingAttempts?: number) => Promise<T>

export type Item = {
  urn: string
  amount: number // TODO: maybe this could be individualData.length
  individualData: {
    id: string
    tokenId: string
    transferredAt: number
    price: number
  }[]
  rarity: string
}

export type ThirdPartyWearable = {
  urn: string
  amount: number // TODO: maybe this could be individualData.length
  individualData: {
    id: string
  }[]
}

export type Name = {
  name: string
  contractAddress: string
  tokenId: string
  price?: string
}

export type LAND = {
  contractAddress: string
  tokenId: string
  category: string
  name?: string
  x?: string
  y?: string
  description?: string
  price?: string
  image?: string
}

export type PaginatedResponse<T> = {
  status: number
  body: {
    elements: T[]
    totalAmount: number
    pageNum: number
    pageSize: number
  }
}

export type ErrorResponse = {
  status: number
  body: {
    error: string
  }
}

export type Limits = {
  offset: number
  limit: number
}

export type Pagination = Limits & {
  pageSize: number
  pageNum: number
}

export type ThirdParty = {
  id: string
  resolver: string
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

export type WearableDefinition = Omit<Wearable, 'data'> & {
  data: Omit<Wearable['data'], 'representations'> & {
    representations: WearableDefinitionRepresentation[]
  }
}
export type WearableDefinitionRepresentation = Omit<WearableRepresentation, 'contents'> & {
  contents: { key: string; url: string }[]
}

export type EmoteDefinition = Omit<Emote, 'emoteDataADR74'> & {
  emoteDataADR74: Omit<Emote['emoteDataADR74'], 'representations'> & {
    representations: EmoteDefinitionRepresentation[]
  }
}

export type EmoteDefinitionRepresentation = Omit<EmoteRepresentationADR74, 'contents'> & {
  contents: { key: string; url: string }[]
}
