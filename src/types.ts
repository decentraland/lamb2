import type { IFetchComponent } from "@well-known-components/http-server"
import type {
  IConfigComponent,
  ILoggerComponent,
  IHttpServerComponent,
  IBaseComponent,
  IMetricsComponent,
} from "@well-known-components/interfaces"
import { metricDeclarations } from "./metrics"
import { TheGraphComponent } from "./ports/the-graph"
import { Profile, IPFSv1, IPFSv2 } from '@dcl/schemas'
import { ContentComponent } from "./ports/content"
import { OwnershipCachesComponent } from "./ports/ownership-caches"
import { Variables } from "@well-known-components/thegraph-component"
import LRU from 'lru-cache'

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
  wearablesCache: LRU<string, wearableForResponse[]>
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
  findWearablesByOwner: (owner: string) => Promise<string[]>
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
 
export interface wearablesQueryResponse {
  nfts: wearableFromQuery[]
}

export type wearableFromQuery = {
  urn: string,
  id: string,
  image: string,
  transferredAt: number,
  item: {
    metadata: {
      wearable: {
        name: string,
        description: string
      }
    }
    rarity: string,
    price: number
  }
}

// The response is grouped by URN
export type wearableForResponse = {
  urn: string,
  image: string,
  name: string,
  description: string,
  rarity: string,
  individualData: {
    id: string,
    transferredAt: number,
    price: number
  }[]
}

export interface emotesQueryResponse {
  nfts: emoteFromQuery[]
}

export type emoteFromQuery = {
  urn: string,
  id: string,
  image: string,
  transferredAt: number,
  item: {
    metadata: {
      emote: {
        name: string,
        description: string
      }
    }
    rarity: string,
    price: number
  }
}

export type emoteForResponse = {
  urn: string,
  id: string,
  image: string,
  transferredAt: number,
  name: string,
  description: string,
  rarity: string,
  price: number
}

export interface namesQueryResponse {
  nfts: nameFromQuery[]
}

export type nameFromQuery = {
  name: string,
  contractAddress: string,
  tokenId: string,
  activeOrder: {
    price: string
  }
}

export type nameForResponse = {
  name: string,
  contractAddress: string,
  tokenId: string,
  price: string | null
}

export interface landsQueryResponse {
  nfts: landFromQuery[]
}

export type landFromQuery = {
  name: string,
  contractAddress: string,
  tokenId: string,
  category: string,
  parcel: {
    x: string,
    y: string,
    data: {
      description: string
    }
  }
  estate: {
    data: {
      description: string
    }
  },
  activeOrder: {
    price: string
  },
  image: string
}

export type landForResponse = {
  name: string,
  contractAddress: string,
  tokenId: string,
  category: string,
  x?: string,
  y?: string,
  description: string | undefined,
  price: string | null,
  image: string
}
