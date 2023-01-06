import { test } from "../components"

test("integration sanity tests using a real server backend", function ({ components, stubComponents }) {
  it("responds with commitHash", async () => {
    const { localFetch } = components
    const r = await localFetch.fetch("/status")

    expect(r.status).toEqual(200)
    expect(await r.json()).toEqual({ commitHash: 'commit_hash' })
  })

  it("calling /status increments a metric", async () => {
    const { localFetch } = components
    const { metrics } = stubComponents

    const r = await localFetch.fetch("/status")

    expect(r.status).toEqual(200)
    expect(await r.json()).toEqual({ commitHash: 'commit_hash' })

    expect(metrics.increment.calledOnceWith("test_status_counter", { pathname: "/status" })).toEqual(true)
  })

  it("random url responds 404", async () => {
    const { localFetch } = components

    const r = await localFetch.fetch("/status" + Math.random())

    expect(r.status).toEqual(404)
  })

  it("next call to /status should fail in 'metrics' component", async () => {
    const { localFetch } = components
    const { metrics } = stubComponents

    metrics.increment.throwsException("some exception")

    const r = await localFetch.fetch("/status")

    expect(r.status).toEqual(500)
  })
})