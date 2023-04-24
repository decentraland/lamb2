import {
  Emote,
  EmoteCategory,
  EmoteRepresentationADR74,
  IPFSv1,
  IPFSv2,
  Profile,
  Rarity,
  Wearable,
  WearableCategory,
  WearableRepresentation
} from '@dcl/schemas'
import type { IFetchComponent } from '@well-known-components/http-server'
import type {
  IBaseComponent,
  IConfigComponent,
  IHttpServerComponent,
  ILoggerComponent,
  IMetricsComponent
} from '@well-known-components/interfaces'
import { Variables } from '@well-known-components/thegraph-component'
import { DefinitionsFetcher } from './adapters/definitions-fetcher'
import { ElementsFetcher } from './adapters/elements-fetcher'
import { ThirdPartyProvidersFetcher } from './adapters/third-party-providers-fetcher'
import { WearablesCachesComponent } from './controllers/handlers/old-wearables-handler'
import { metricDeclarations } from './metrics'
import { ContentComponent } from './ports/content'
import { OwnershipCachesComponent } from './ports/ownership-caches'
import { TheGraphComponent } from './ports/the-graph'
import { BaseItem } from './logic/fetch-elements/fetch-base-items'

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
  baseWearablesFetcher: ElementsFetcher<BaseItem>
  wearablesFetcher: ElementsFetcher<Item>
  thirdPartyProvidersFetcher: ThirdPartyProvidersFetcher
  thirdPartyWearablesFetcher: ElementsFetcher<ThirdPartyWearable & { definition: WearableDefinition }>
  emotesFetcher: ElementsFetcher<Item>
  emoteDefinitionsFetcher: DefinitionsFetcher<EmoteDefinition>
  wearableDefinitionsFetcher: DefinitionsFetcher<WearableDefinition>
  namesFetcher: ElementsFetcher<Name>
  landsFetcher: ElementsFetcher<LAND>

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
export type EmoteId = string // These ids are used as pointers on the content server

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
  name: string
  category: WearableCategory | EmoteCategory
  rarity: string
  minTransferredAt: number
  maxTransferredAt: number
}

export type ThirdPartyWearable = {
  urn: string
  amount: number // TODO: maybe this could be individualData.length
  individualData: {
    id: string
  }[]
  name: string
  category: WearableCategory
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

export type ItemResponse = Omit<Item, 'minTransferredAt' | 'maxTransferredAt'> & {
  definition?: WearableDefinition | EmoteDefinition
}

export type WearableType = 'base-wearable' | 'on-chain' | 'third-party'

export type BaseWearableFilters = {
  categories: WearableCategory[]
  name: string
}

export type OnChainWearableFilters = BaseWearableFilters & {
  rarity: Rarity
}

export type ThirdPartyWearableFilters = BaseWearableFilters & {
  collectionUrns: string[]
}

export type WearableFilters = BaseWearableFilters & OnChainWearableFilters & ThirdPartyWearableFilters

export type BaseWearableSorting = {
  orderBy: 'date' | 'name' // date = entity.timestamp WARNING if equals
  direction: 'ASC' | 'DESC'
}

export type OnChainWearableSorting = {
  orderBy: 'date' | 'rarity' | 'name' // date = transferredAt
  direction: 'ASC' | 'DESC'
}

export type ThirdPartyWearableSorting = BaseWearableSorting

export type WearableSorting = BaseWearableSorting & OnChainWearableSorting & ThirdPartyWearableSorting

type BaseWearableArguments = BaseWearableFilters & BaseWearableSorting
type OnChainWearableArguments = OnChainWearableFilters & OnChainWearableSorting
type ThirdPartyWearableArguments = ThirdPartyWearableFilters & ThirdPartyWearableSorting
