import { createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createServerComponent, createStatusCheckComponent } from "@well-known-components/http-server"
import { createLogComponent } from "@well-known-components/logger"
import { createFetchComponent } from "./ports/fetch"
import { createMetricsComponent } from "@well-known-components/metrics"
import { AppComponents, GlobalContext } from "./types"
import { metricDeclarations } from "./metrics"
import { createTheGraphComponent } from "./ports/the-graph"
import { ContentAPI, ContentClient } from 'dcl-catalyst-client'
import { ISubgraphComponent, createSubgraphComponent } from '@well-known-components/thegraph-component'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  
  const config = await createDotEnvConfigComponent({ path: [".env.default", ".env"] })
  const logs = createLogComponent()
  const server = await createServerComponent<GlobalContext>({ config, logs }, {})
  const statusChecks = await createStatusCheckComponent({ server, config })
  const fetch = await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })
  
  const contentServerAddress = (await config.getString('CONTENT_SERVER_ADDRESS')) ?? 'http://content-server:6969'
  const contentClient: ContentAPI = new ContentClient({ contentUrl: contentServerAddress })

  const theGraph = await createTheGraphComponent({ config, logs, fetch, metrics })

  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics,
    contentClient,
    theGraph
  }
}
