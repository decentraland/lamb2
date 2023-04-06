import { createConfigComponent, createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createTestMetricsComponent } from "@well-known-components/metrics"
import { statusHandler } from "../../src/controllers/handlers/status-handler"
import { metricDeclarations } from "../../src/metrics"

describe("status-controller-unit", () => {
  it("must return commit hash", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {COMMIT_HASH: 'commit_hash'})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { commitHash: 'commit_hash' } })
  })

  it("must return current version", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {CURRENT_VERSION: 'current_version'})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { version: 'current_version' } })
  })

  it("must return default content server address", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { contentServerUrl: 'https://peer.decentraland.org/content' } })
  })

  it("must return default content server address", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { contentServerUrl: 'https://peer.decentraland.org/content' } })
  })

  it("must return currentTime", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { currentTime: expect.any(Number) } })
  })

  it("must return empty for values that does not have default value", async () => {
    const url = new URL("https://github.com/well-known-components")
    const config = await createDotEnvConfigComponent({}, {})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({ body: { commitHash: '', version: '' } })
  })
})
