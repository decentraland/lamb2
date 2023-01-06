import { IMetricsComponent } from "@well-known-components/interfaces"
import { validateMetricsDeclaration } from "@well-known-components/metrics"
import { getDefaultHttpMetrics } from '@well-known-components/metrics/dist/http'

export const metricDeclarations = {
  ...getDefaultHttpMetrics(),
  test_status_counter: {
    help: "Count calls to ping",
    type: IMetricsComponent.CounterType,
    labelNames: ["pathname"]
  },
  profiles_counter: {
    help: "Count calls to profiles",
    type: IMetricsComponent.CounterType,
    labelNames: ["pathname", "ids"]
  },
  subgraph_ok_total: {
    help: "Count total calls to subgraph",
    type: IMetricsComponent.CounterType,
    labelNames: ["url"]
  },
  subgraph_errors_total: {
    help: "Count total calls to subgraph",
    type: IMetricsComponent.CounterType,
    labelNames: ["url", "errorMessage"]
  },
  dcl_lamb2_server_build_info: {
    help: 'Lamb2 server static build info.',
    type: IMetricsComponent.GaugeType,
    labelNames: ['commitHash']
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
