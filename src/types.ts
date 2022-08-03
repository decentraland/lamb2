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
import { ContentAPI } from 'dcl-catalyst-client'
import { Profile, IPFSv1, IPFSv2 } from '@dcl/schemas'

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
  contentClient: ContentAPI
  theGraph: TheGraphComponent
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

export type ProfileData = {
  metadata: ProfileMetadata
  content: Map<Filename, Filehash>
}

export type ProfileMetadata = Profile & {
  timestamp: number
}

// export type ProfileMetadata = {
//   timestamp: number
//   avatars: {
//     name: string
//     description: string
//     hasClaimedName?: boolean
//     avatar: Avatar
//   }[]
// }

// export type AvatarSnapshots = Record<string, string>

// type Avatar = {
//   bodyShape: any
//   eyes: any
//   hair: any
//   skin: any
//   snapshots: AvatarSnapshots
//   version: number
//   wearables: WearableId[]
// }
