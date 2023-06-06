import { IMetricsComponent } from '@well-known-components/interfaces'
import { validateMetricsDeclaration } from '@well-known-components/metrics'
import { getDefaultHttpMetrics } from '@well-known-components/metrics/dist/http'
import { metricDeclarations as logMetricDeclarations } from '@well-known-components/logger'
import { metricDeclarations as theGraphMetricDeclarations } from '@well-known-components/thegraph-component'

export const metricDeclarations = {
  ...getDefaultHttpMetrics(),
  ...logMetricDeclarations,
  ...theGraphMetricDeclarations,
  profiles_counter: {
    help: 'Count calls to profiles',
    type: IMetricsComponent.CounterType,
    labelNames: ['pathname', 'ids']
  },
  dcl_lamb2_server_build_info: {
    help: 'Lamb2 server static build info.',
    type: IMetricsComponent.GaugeType,
    labelNames: ['commitHash']
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
