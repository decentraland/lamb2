const baseConfig = require('./jest.config')

// End-to-end suites hit a deployed realm over the network (peer.decentraland.zone by default,
// E2E_REALM_URL to point elsewhere). They depend on live data and third-party services, so they
// are run on demand with `yarn test:e2e` and are not part of the CI gate.
module.exports = {
  ...baseConfig,
  testMatch: ['**/test/e2e/**/*.spec.ts'],
  testTimeout: 90_000,
  collectCoverage: false,
  coverageThreshold: undefined
}
