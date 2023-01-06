import { createConfigComponent, createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createTestMetricsComponent } from "@well-known-components/metrics"
import { statusHandler } from "../../src/controllers/handlers/status-handler"
import { metricDeclarations } from "../../src/metrics"

describe("ping-controller-unit", () => {
  it("must return commit HASH", async () => {
    const url = new URL("https://github.com/well-known-components")
    const metrics = createTestMetricsComponent(metricDeclarations)
    const config = await createDotEnvConfigComponent({}, {COMMIT_HASH: 'commit_hash'})
    expect((await metrics.getValue("test_status_counter")).values).toEqual([])
    expect(await statusHandler({ url, components: { metrics, config } })).toEqual({ body: { commitHash: 'commit_hash' } })
    expect((await metrics.getValue("test_status_counter")).values).toEqual([
      { labels: { pathname: "/well-known-components" }, value: 1 },
    ])
  })

  it("metrics should create a brand new registry", async () => {
    const url = new URL("https://github.com/well-known-components")
    const metrics = createTestMetricsComponent(metricDeclarations)
    const config = await createDotEnvConfigComponent({}, {COMMIT_HASH: 'commit_hash'})
    expect((await metrics.getValue("test_status_counter")).values).toEqual([])
    expect(await statusHandler({ url, components: { metrics, config } })).toEqual({ body: { commitHash: 'commit_hash' } })
    expect((await metrics.getValue("test_status_counter")).values).toEqual([
      { labels: { pathname: "/well-known-components" }, value: 1 },
    ])
  })

  it("calling twice should increment twice the metrics", async () => {
    const url = new URL("https://github.com/well-known-components")
    const metrics = createTestMetricsComponent(metricDeclarations)
    const config = await createDotEnvConfigComponent({}, {COMMIT_HASH: 'commit_hash'})
    expect((await metrics.getValue("test_status_counter")).values).toEqual([])
    expect(await statusHandler({ url, components: { metrics, config } })).toEqual({ body: { commitHash: 'commit_hash' } })
    expect(await statusHandler({ url, components: { metrics, config } })).toEqual({ body: { commitHash: 'commit_hash' } })
    expect((await metrics.getValue("test_status_counter")).values).toEqual([
      { labels: { pathname: "/well-known-components" }, value: 2 },
    ])
  })
})
