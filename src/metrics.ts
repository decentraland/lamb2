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
  },
  tpw_provider_fetch_assets_duration_seconds: {
    help: 'Third Party Provider fetch assets request duration in seconds.',
    type: IMetricsComponent.HistogramType,
    labelNames: ['id']
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
