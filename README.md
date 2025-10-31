# Catalyst: Lambdas v2

[![Coverage Status](https://coveralls.io/repos/github/decentraland/lamb2/badge.svg?branch=coverage)](https://coveralls.io/github/decentraland/lamb2?branch=coverage)

The lamb2 service is a new implementation that replaces the previous lambdas service bundle associated with Catalyst nodes. The lambdas service provides an API for interacting with Catalyst Content Servers, assisting in the resolution of entities and assets for any Decentraland client.

You can explore the Lambdas API along with the rest of the Catalyst API [here](https://decentraland.github.io/catalyst-api-specs/#tag/Lambdas).

## API Documentation

Comprehensive OpenAPI 3.0 specification is available in the [`docs`](./docs) folder. The documentation includes:

- Complete endpoint definitions with request/response schemas
- Multiple environment configurations (Production, Staging, Development)
- Filtering, sorting, and pagination patterns
- Example requests and usage patterns

See the [API Documentation README](./docs/README.md) for viewing options and usage examples.

## Related Resources

[Catalyst Owner](https://github.com/decentraland/catalyst-owner): This bundle of services allows you to deploy a Catalyst node and incorporates the lamb2 service.
[Catalyst](https://github.com/decentraland/catalyst): This repository contains the implementation of the content server.

## Running the Server

For development, configure the `.env` file to point to your desire services and run the following commands:

```bash
git clone https://github.com/decentraland/lamb2.git
yarn
yarn build
yarn start
```

## 🤖 AI Agent Context

**Service Purpose:** Provides utility APIs for Decentraland clients to interact with Catalyst Content Servers. Replaces the legacy lambdas service with improved architecture, offering entity resolution, ownership validation, asset queries, and client helper functions.

**Key Capabilities:**

- Queries entities by address/pointer with filtering and pagination
- Validates ownership of wearables, emotes, names, and other assets
- Resolves entity metadata and content for client consumption
- Provides user profile queries and wearable/emote collections
- Supports sorting, filtering, and pagination across endpoints
- Integrates with The Graph for blockchain ownership verification

**Communication Pattern:** Synchronous HTTP REST API

**Technology Stack:**

- Runtime: Node.js
- Language: TypeScript
- HTTP Framework: @well-known-components/http-server
- Component Architecture: @well-known-components (logger, metrics, http-server, env-config-provider)

**External Dependencies:**

- Content Servers: Catalyst nodes (fetches entity data)
- Blockchain Indexing: The Graph subgraphs (ownership validation)
- Storage: Catalyst storage (content file access)

**API Specification:** OpenAPI 3.0 spec in `docs/` folder. See [Catalyst API Specs](https://decentraland.github.io/catalyst-api-specs/#tag/Lambdas) for complete documentation
