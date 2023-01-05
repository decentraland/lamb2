import { HandlerContextWithPath } from "../../types"

// handlers arguments only type what they need, to make unit testing easier
export async function statusHandler(context: Pick<HandlerContextWithPath<"metrics" | "config", "/status">, "url" | "components">) {
  const {
    url,
    components: { metrics, config },
  } = context

  metrics.increment("test_status_counter", {
    pathname: url.pathname,
  })

  const commit = await config.getString("COMMIT_SHA") ?? ''
  const commit2 = process.env.COMMIT_SHA

  return {
    body: {
      commit: commit,
      commit2: commit2
    },
  }
}
