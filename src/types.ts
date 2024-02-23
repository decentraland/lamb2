import {
  EmoteCategory,
  EmoteDefinition,
  Entity,
  IPFSv1,
  IPFSv2,
  Profile,
  Rarity,
  WearableCategory,
  WearableDefinition
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
import { ContentClient } from 'dcl-catalyst-client'
import { HTTPProvider } from 'eth-connect'
import { CatalystsFetcher } from './adapters/catalysts-fetcher'
import { DefinitionsFetcher } from './adapters/definitions-fetcher'
import { ElementsFetcher } from './adapters/elements-fetcher'
import { EntitiesFetcher } from './adapters/entities-fetcher'
import { NameDenylistFetcher } from './adapters/name-denylist-fetcher'
import { POIsFetcher } from './adapters/pois-fetcher'
import { IResourcesStatusComponent } from './adapters/resource-status'
import { IStatusComponent } from './adapters/status'
import { metricDeclarations } from './metrics'
import { OwnershipCachesComponent } from './ports/ownership-caches'
import { TheGraphComponent } from './ports/the-graph'
import { ThirdPartyProvidersServiceFetcher } from './adapters/third-party-providers-service-fetcher'
import { ThirdPartyProvidersGraphFetcher } from './adapters/third-party-providers-graph-fetcher'
import { ThirdPartyProvidersStorage } from './logic/third-party-providers-storage'
import { IProfilesComponent } from './adapters/profiles'
import { DefaultProfilesComponent } from './adapters/default-profiles'

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
  content: Pick<ContentClient, 'fetchEntitiesByPointers'>
  contentServerUrl: string
  theGraph: TheGraphComponent
  ownershipCaches: OwnershipCachesComponent
  baseWearablesFetcher: ElementsFetcher<BaseWearable>
  wearablesFetcher: ElementsFetcher<OnChainWearable>
  thirdPartyProvidersGraphFetcher: ThirdPartyProvidersGraphFetcher
  thirdPartyProvidersServiceFetcher: ThirdPartyProvidersServiceFetcher
  thirdPartyProvidersStorage: ThirdPartyProvidersStorage
  thirdPartyWearablesFetcher: ElementsFetcher<ThirdPartyWearable>
  emotesFetcher: ElementsFetcher<OnChainEmote>
  emoteDefinitionsFetcher: DefinitionsFetcher<EmoteDefinition>
  wearableDefinitionsFetcher: DefinitionsFetcher<WearableDefinition>
  entitiesFetcher: EntitiesFetcher
  namesFetcher: ElementsFetcher<Name>
  landsFetcher: ElementsFetcher<LAND>
  resourcesStatusCheck: IResourcesStatusComponent
  status: IStatusComponent
  l1Provider: HTTPProvider
  l2Provider: HTTPProvider
  catalystsFetcher: CatalystsFetcher
  poisFetcher: POIsFetcher
  nameDenylistFetcher: NameDenylistFetcher
  profiles: IProfilesComponent
  defaultProfiles: DefaultProfilesComponent
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

/**
 * Function used to fetch TheGraph
 * @public
 */
export type QueryGraph = <T = any>(query: string, variables?: Variables, remainingAttempts?: number) => Promise<T>

export type Item<C extends WearableCategory | EmoteCategory> = {
  urn: string
  amount: number // TODO: maybe this could be individualData.length
  individualData: {
    id: string
    tokenId: string
    transferredAt: number
    price: number
  }[]
  name: string
  rarity: string
  minTransferredAt: number
  maxTransferredAt: number
  category: C
}

export type HasUrn = { urn: string }
export type HasName = { name: string } & HasUrn
export type HasRarity = { rarity: string } & HasUrn
export type HasDate = { minTransferredAt: number; maxTransferredAt: number } & HasUrn

export type SortingFunction<T> = (item1: T, item2: T) => number

export type OnChainWearable = Item<WearableCategory>

export type OnChainEmote = Item<EmoteCategory>

export type ThirdPartyWearable = {
  urn: string
  amount: number
  individualData: {
    id: string
  }[]
  name: string
  category: WearableCategory
  entity: Entity
}

export type BaseWearable = ThirdPartyWearable

export type Name = {
  name: string
  contractAddress: string
  tokenId: string
  price?: number
}

export type LAND = {
  contractAddress: string
  tokenId: string
  category: string
  name?: string
  x?: string
  y?: string
  description?: string
  price?: number
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

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
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

export type ThirdPartyProvider = {
  id: string
  resolver: string
  metadata: {
    thirdParty: {
      name: string
      description: string
    }
  }
}

export type ThirdPartyAsset = {
  id: string
  amount: number
  urn: {
    decentraland: string
  }
}

export type OnChainWearableResponse = Omit<OnChainWearable, 'minTransferredAt' | 'maxTransferredAt'> & {
  definition?: WearableDefinition
  entity?: Entity
}

export type OnChainEmoteResponse = Omit<OnChainEmote, 'minTransferredAt' | 'maxTransferredAt'> & {
  definition?: EmoteDefinition
  entity?: Entity
}

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

export type TypedEntity<T> = Omit<Entity, 'metadata'> & {
  metadata?: T
}
