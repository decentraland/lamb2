import { IMetricsComponent } from '@well-known-components/interfaces'
import { validateMetricsDeclaration } from '@dcl/metrics'
import { metricDeclarations as logMetricDeclarations } from '@well-known-components/logger'
import { metricDeclarations as theGraphMetricDeclarations } from '@dcl/thegraph-component'
import { getDefaultHttpMetrics } from '@dcl/http-server'

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
  },
  elements_cache_reads_total: {
    help: 'Owned-elements cache reads, by what the read got. `stale` means a caller accepted an entry older than its TTL while a refresh ran behind it.',
    type: IMetricsComponent.CounterType,
    labelNames: ['result']
  },
  elements_cache_background_refresh_total: {
    help: 'Refreshes of the owned-elements cache running detached from a request. `skipped` means the concurrency ceiling was hit, so that read did not self-heal.',
    type: IMetricsComponent.CounterType,
    labelNames: ['outcome']
  },
  cache_warmer_collections_warmed_total: {
    help: 'Total number of collections successfully warmed by the cache warmer',
    type: IMetricsComponent.CounterType,
    labelNames: ['collection']
  },
  cache_warmer_duration_seconds: {
    help: 'Duration of cache warming per collection in seconds',
    type: IMetricsComponent.HistogramType,
    labelNames: ['collection']
  },
  cache_warmer_errors_total: {
    help: 'Total number of cache warming errors',
    type: IMetricsComponent.CounterType,
    labelNames: ['collection']
  },
  cache_warmer_fatal_errors_total: {
    help: 'Total number of fatal cache warming errors',
    type: IMetricsComponent.CounterType,
    labelNames: []
  },
  cache_warmer_total_duration_seconds: {
    help: 'Total duration of full cache warmup cycle in seconds',
    type: IMetricsComponent.HistogramType,
    labelNames: []
  },
  cache_warmer_last_warmup_timestamp: {
    help: 'Unix timestamp of the last successful cache warmup',
    type: IMetricsComponent.GaugeType,
    labelNames: []
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
