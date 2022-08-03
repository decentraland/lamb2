import { IMetricsComponent } from "@well-known-components/interfaces"
import { validateMetricsDeclaration } from "@well-known-components/metrics"

export const metricDeclarations = {
  test_ping_counter: {
    help: "Count calls to ping",
    type: IMetricsComponent.CounterType,
    labelNames: ["pathname"]
  },
  profiles_counter: {
    help: "Count calls to profiles",
    type: IMetricsComponent.CounterType,
    labelNames: ["pathname", "ethAddresses"]
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
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
