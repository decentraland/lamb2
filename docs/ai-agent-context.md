# AI Agent Context

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
