module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {tsconfig: "test/tsconfig.json"}]
  },
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts", "src/**/*.js"],
  testMatch: ["**/test/unit/**/*.spec.ts"],
  testEnvironment: "node",
  // Per-file floors for the adapters that own caching, ownership and the profile assembly. They sit a
  // few points under what the suites cover today so a regression in these paths fails CI instead of
  // shipping green; nothing is enforced repo-wide.
  coverageThreshold: {
    "./src/adapters/elements-fetcher.ts": { lines: 80 },
    "./src/adapters/profiles.ts": { lines: 90 },
    "./src/adapters/marketplace-api-fetcher.ts": { lines: 90 },
    "./src/logic/concurrency.ts": { lines: 95 },
    "./src/logic/api-with-fallback.ts": { lines: 95 },
    "./src/logic/fetch-elements/fetch-items.ts": { lines: 95 },
    "./src/logic/fetch-elements/graph-pagination.ts": { lines: 95 }
  },
}
