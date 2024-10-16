# Catalyst: Lambdas v2

[![Coverage Status](https://coveralls.io/repos/github/decentraland/lamb2/badge.svg?branch=coverage)](https://coveralls.io/github/decentraland/lamb2?branch=coverage)

The lamb2 service is a new implementation that replaces the previous lambdas service bundle associated with Catalyst nodes. The lambdas service provides an API for interacting with Catalyst Content Servers, assisting in the resolution of entities and assets for any Decentraland client.

You can explore the Lambdas API along with the rest of the Catalyst API [here](https://decentraland.github.io/catalyst-api-specs/#tag/Lambdas).

You may also want to check the following resources:

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
