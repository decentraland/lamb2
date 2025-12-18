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
- **[Marketplace API](https://github.com/decentraland/marketplace-server)**: Primary data source for NFT collections, wearables, emotes, and names with enhanced metadata
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

The service uses environment variables for configuration.
Create a `.env` file in the root directory containing the environment variables for the service to run.
Use the `.env.default` variables as an example.

### Running the Service

#### Setting up the environment

The Lambdas v2 service is a lightweight, stateless service that does not require local databases or message brokers. Unlike many backend services, it can run standalone with minimal setup.

#### Running in development mode

To run the service in development mode:

```bash
yarn build
yarn start
```

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
