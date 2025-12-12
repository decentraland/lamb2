# Catalyst: Lambdas v2

[![Coverage Status](https://coveralls.io/repos/github/decentraland/lamb2/badge.svg?branch=main)](https://coveralls.io/github/decentraland/lamb2?branch=main)

The Lambdas v2 (lamb2) service is a modern implementation that replaces the legacy lambdas service bundle associated with Catalyst nodes. This service provides a comprehensive API for interacting with Catalyst Content Servers, enabling Decentraland clients to resolve entities, validate asset ownership, query user profiles, and access blockchain-based NFT data across the Decentraland ecosystem.

This server interacts with Catalyst Content Servers, The Graph subgraphs, blockchain smart contracts, and third-party NFT providers to deliver real-time information about user assets, profiles, and Decentraland world configurations.

## Table of Contents

- [Features](#features)
- [Dependencies & Related Services](#dependencies--related-services)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Service](#running-the-service)
- [Testing](#testing)
- [AI Agent Context](#ai-agent-context)

## Features

- **User Assets**: Retrieve wearables, emotes, names, and lands owned by Ethereum addresses with filtering and pagination support
- **Profile Management**: Fetch and manage user profiles with support for avatar configurations and versioning
- **Ownership Validation**: Verify ownership of wearables, emotes, names, and other Decentraland assets using blockchain data
- **Third-Party Integrations**: Support for third-party wearables and collections with real-time NFT ownership validation
- **NFT Collections**: Query all available NFT collections across Ethereum mainnet (L1) and Polygon (L2) networks
- **Entity Resolution**: Resolve entity metadata and content files from Catalyst Content Servers for client consumption
- **Contract Data**: Access Catalyst servers list from DAO, Points of Interest (POIs), and name denylists from smart contracts
- **Outfit Queries**: Retrieve outfit configurations and validate ownership of outfit components
- **Parcel Permissions**: Query parcel operators and permissions for Decentraland LAND parcels
- **Explorer Endpoints**: Specialized endpoints for Decentraland Explorer client with combined asset queries
- **Smart Caching**: LRU cache implementation for improved performance on blockchain and API queries

## Dependencies & Related Services

This service interacts with the following services:

- **[Catalyst Content Server](https://github.com/decentraland/catalyst)**: Fetches entity data, wearable definitions, and content files for Decentraland assets
- **[Catalyst Owner](https://github.com/decentraland/catalyst-owner)**: Deployment bundle that incorporates lamb2 as part of the complete Catalyst node stack
- **[Marketplace API](https://market.decentraland.org)**: Primary data source for NFT collections, wearables, emotes, and names with enhanced metadata

External dependencies:

- **The Graph Subgraphs**: Blockchain indexing service for ownership verification across multiple subgraphs:
  - Ethereum Collections Subgraph (L1 wearables/emotes)
  - Polygon Collections Subgraph (L2 wearables/emotes)
  - ENS Subgraph (Decentraland name ownership)
  - Third-Party Registry Subgraph (third-party collections)
  - Land Manager Subgraph (LAND and Estate ownership)
- **Ethereum RPC**: Connects to Ethereum mainnet or Sepolia via `https://rpc.decentraland.org` for smart contract queries
- **Polygon RPC**: Connects to Polygon mainnet or Amoy via `https://rpc.decentraland.org` for L2 smart contract queries
- **NFT Worker (Alchemy)**: Third-party NFT ownership validation service at `https://nfts.decentraland.org`
- **Catalyst DAO Contract**: Retrieves approved Catalyst servers list from the DAO on Ethereum mainnet
- **POI Contract**: Fetches Points of Interest from Polygon network
- **Name Denylist Contract**: Retrieves denied names from Ethereum mainnet

## API Documentation

The API is fully documented using the [OpenAPI standard](https://swagger.io/specification/). Its schema is located at [docs/openapi.yaml](docs/openapi.yaml).

## Getting Started

### Prerequisites

Before running this service, ensure you have the following installed:

- **Node.js**: Version 18.x or higher (LTS recommended)
- **Yarn**: Version 1.22.x or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/decentraland/lamb2.git
cd lamb2
```

2. Install dependencies:

```bash
yarn install
```

3. Build the project:

```bash
yarn build
```

### Configuration

The service uses environment variables for configuration. The service will automatically load configuration from `.env.default` and `.env` files (with `.env` taking precedence).

**Required environment variables:**

- `LAMBDAS_URL`: Public URL where this lambdas service is accessible (e.g., `https://peer.decentraland.zone/lambdas/`)
- `CONTENT_URL`: URL of the Catalyst Content Server (e.g., `https://peer.decentraland.zone/content/`)
- `MARKETPLACE_API_URL`: Marketplace API base URL (e.g., `https://marketplace-api.decentraland.zone/`)

**Optional environment variables:**

- `ETH_NETWORK`: Ethereum network to use (`mainnet` or `sepolia`, defaults to `mainnet`)
- `HTTP_SERVER_PORT`: Port for the HTTP server (defaults to `7272`)
- `HTTP_SERVER_HOST`: Host for the HTTP server (defaults to `0.0.0.0`)
- `INTERNAL_LAMBDAS_URL`: Internal URL for health checks (optional)
- `INTERNAL_CONTENT_URL`: Internal URL for content server health checks (optional)
- `ARCHIPELAGO_URL`: URL for Archipelago communications service (optional)
- `INTERNAL_ARCHIPELAGO_URL`: Internal URL for Archipelago health checks (optional)
- `REALM_NAME`: Name of the realm for the `/about` endpoint (optional)
- `MAX_USERS`: Maximum number of users for the realm (optional)
- `COMMIT_HASH`: Git commit hash for status reporting (optional)
- `CURRENT_VERSION`: Service version for status reporting (optional)
- `NFT_WORKER_BASE_URL`: Base URL for NFT worker service (defaults to `https://nfts.decentraland.org`)
- `COLLECTIONS_L1_SUBGRAPH_URL`: Custom The Graph subgraph URL for L1 collections (optional)
- `COLLECTIONS_L2_SUBGRAPH_URL`: Custom The Graph subgraph URL for L2 collections (optional)
- `ENS_OWNER_PROVIDER_URL`: Custom ENS subgraph URL (optional)
- `THIRD_PARTY_REGISTRY_SUBGRAPH_URL`: Custom third-party registry subgraph URL (optional)
- `LAND_SUBGRAPH_URL`: Custom land manager subgraph URL (optional)

### Running the Service

#### Setting up the environment

The Lambdas v2 service is a lightweight, stateless service that does not require local databases or message brokers. Unlike many backend services, it can run standalone with minimal setup.

The service only requires:

- Network access to Catalyst Content Server (configured via `CONTENT_URL`)
- Network access to The Graph subgraphs (uses public endpoints by default)
- Network access to Ethereum and Polygon RPC endpoints (via `https://rpc.decentraland.org`)
- Network access to NFT Worker service (optional, for third-party wearables)

No docker-compose setup is needed - the service is ready to run once configured.

#### Running in development mode

To run the service in development mode:

```bash
yarn build
yarn start
```

This will:

- Start the HTTP server on the port specified by `HTTP_SERVER_PORT` (defaults to 7272)
- Connect to the configured Content Server and The Graph subgraphs
- Begin serving API requests at `http://localhost:6969`

#### Running in production mode

For production deployment, ensure all required environment variables are properly configured, and run:

```bash
yarn build
yarn start
```

The service is typically deployed as part of the [Catalyst Owner](https://github.com/decentraland/catalyst-owner) bundle, which provides the complete Catalyst node infrastructure.

## Testing

This service includes comprehensive test coverage with both unit and integration tests.

### Running Tests

Run all tests with coverage:

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test --watch
```

Run only unit tests:

```bash
yarn test test/unit
```

Run only integration tests:

```bash
yarn test test/integration
```

### Test Structure

- **Unit Tests** (`test/unit/`): Test individual components and functions in isolation
- **Integration Tests** (`test/integration/`): Test the complete request/response cycle with mocked external dependencies

For detailed testing guidelines and standards, refer to our [Testing Standards](https://github.com/decentraland/docs/tree/main/development-standards/testing-standards) documentation.

## AI Agent Context

For detailed AI Agent context, see [docs/ai-agent-context.md](docs/ai-agent-context.md).
