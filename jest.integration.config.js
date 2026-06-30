const baseConfig = require('./jest.config')

// Integration suites spin up the in-process HTTP server and hit it over the
// native fetch (undici); they live under test/integration and are run apart
// from the unit suites so the Docker image build / CI gate stays on the fast,
// deterministic unit tests only.
module.exports = {
  ...baseConfig,
  testMatch: ["**/test/integration/**/*.spec.ts"]
}
