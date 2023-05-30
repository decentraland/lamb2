import { createConfigComponent, createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { ServiceStatus } from '../../src/adapters/status'
import { aboutHandler } from '../../src/controllers/handlers/about-handler'
import { AboutResponse } from '@dcl/protocol/out-js/decentraland/realm/about.gen'

// TODO: test against @dcl/protocol

describe('about-controller-unit', () => {
  const defaultConfig = {
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    INTERNAL_LAMBDAS_URL: 'http://lambdas',
    CONTENT_URL: 'https://peer.decentraland.org/content',
    INTERNAL_CONTENT_URL: 'http://content',
    ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago',
    INTERNAL_ARCHIPELAGO_URL: 'http://archipelgo',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: '1.0.0',
    MAX_USERS: '400'
  }

  async function getValidatedRealmName(): Promise<string | undefined> {
    return 'testName'
  }

  it('sevices are unhealthy', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent(defaultConfig)

    async function getServiceStatus<T>(_statusUrl: string): Promise<ServiceStatus<T>> {
      return { healthy: false }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return false
    }

    const components = {
      config,
      status: { getServiceStatus },
      resourcesStatusCheck: { areResourcesOverloaded },
      realmName: { getValidatedRealmName }
    }

    const response = await aboutHandler({ url, components })

    // NOTE: this is just a type check against the protocol
    const aboutResponse: AboutResponse = response.body
    expect(aboutResponse).toBeTruthy()

    expect(response).toMatchObject({
      status: 503,
      body: {
        healthy: false,
        content: {
          healthy: false,
          publicUrl: defaultConfig.CONTENT_URL,
          commitHash: undefined,
          version: undefined
        },
        lambdas: {
          healthy: true,
          version: defaultConfig.CURRENT_VERSION,
          commitHash: defaultConfig.COMMIT_HASH,
          publicUrl: defaultConfig.LAMBDAS_URL
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        comms: {
          healthy: false,
          protocol: 'v3',
          commitHash: undefined,
          usersCount: 0
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 0,
          publicUrl: '/bff'
        },
        acceptingUsers: false
      }
    })
  })

  it('sevices are healthy', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent(defaultConfig)

    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfig.INTERNAL_LAMBDAS_URL}/status`:
          return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
        case `${defaultConfig.INTERNAL_ARCHIPELAGO_URL}/status`:
          return { healthy: true, data: { version: 'archipelago_1', commitHash: 'archipelago_hash', userCount: 10 } }
        case `${defaultConfig.INTERNAL_CONTENT_URL}/status`:
          return { healthy: true, data: { version: 'content_1', commitHash: 'content_hash' } }
        default:
          return { healthy: false }
      }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return false
    }

    const components = {
      config,
      status: { getServiceStatus },
      resourcesStatusCheck: { areResourcesOverloaded },
      realmName: { getValidatedRealmName }
    }

    const response = await aboutHandler({ url, components })

    // NOTE: this is just a type check against the protocol
    const aboutResponse: AboutResponse = response.body
    expect(aboutResponse).toBeTruthy()

    expect(response).toMatchObject({
      status: 200,
      body: {
        healthy: true,
        content: {
          healthy: true,
          publicUrl: defaultConfig.CONTENT_URL,
          commitHash: 'content_hash',
          version: 'content_1'
        },
        lambdas: {
          healthy: true,
          version: defaultConfig.CURRENT_VERSION,
          commitHash: defaultConfig.COMMIT_HASH,
          publicUrl: defaultConfig.LAMBDAS_URL
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        comms: {
          healthy: true,
          protocol: 'v3',
          commitHash: 'archipelago_hash',
          version: 'archipelago_1',
          usersCount: 10
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 10,
          publicUrl: '/bff'
        },
        acceptingUsers: true
      }
    })
  })

  it('sevices are healthy, but resources are overloaded', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent(defaultConfig)

    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfig.INTERNAL_LAMBDAS_URL}/status`:
          return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
        case `${defaultConfig.INTERNAL_ARCHIPELAGO_URL}/status`:
          return { healthy: true, data: { version: 'archipelago_1', commitHash: 'archipelago_hash', usersCount: 10 } }
        case `${defaultConfig.INTERNAL_CONTENT_URL}/status`:
          return { healthy: true, data: { version: 'content_1', commitHash: 'content_hash' } }
        default:
          return { healthy: false }
      }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return true
    }

    const components = {
      config,
      status: { getServiceStatus },
      resourcesStatusCheck: { areResourcesOverloaded },
      realmName: { getValidatedRealmName }
    }

    const response = await aboutHandler({ url, components })

    // NOTE: this is just a type check against the protocol
    const aboutResponse: AboutResponse = response.body
    expect(aboutResponse).toBeTruthy()

    expect(response).toMatchObject({
      status: 200,
      body: {
        healthy: true,
        content: {
          healthy: true,
          publicUrl: defaultConfig.CONTENT_URL,
          commitHash: 'content_hash',
          version: 'content_1'
        },
        lambdas: {
          healthy: true,
          version: defaultConfig.CURRENT_VERSION,
          commitHash: defaultConfig.COMMIT_HASH,
          publicUrl: defaultConfig.LAMBDAS_URL
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        comms: {
          healthy: true,
          protocol: 'v3',
          commitHash: 'archipelago_hash',
          version: 'archipelago_1',
          usersCount: 10
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 10,
          publicUrl: '/bff'
        },
        acceptingUsers: false
      }
    })
  })

  it('sevices are healthy, but there are too many users', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent(defaultConfig)

    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfig.INTERNAL_LAMBDAS_URL}/status`:
          return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
        case `${defaultConfig.INTERNAL_ARCHIPELAGO_URL}/status`:
          return { healthy: true, data: { version: 'archipelago_1', commitHash: 'archipelago_hash', usersCount: 1000 } }
        case `${defaultConfig.INTERNAL_CONTENT_URL}/status`:
          return { healthy: true, data: { version: 'content_1', commitHash: 'content_hash' } }
        default:
          return { healthy: false }
      }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return false
    }

    const components = {
      config,
      status: { getServiceStatus },
      resourcesStatusCheck: { areResourcesOverloaded },
      realmName: { getValidatedRealmName }
    }

    const response = await aboutHandler({ url, components })

    // NOTE: this is just a type check against the protocol
    const aboutResponse: AboutResponse = response.body
    expect(aboutResponse).toBeTruthy()

    expect(response).toMatchObject({
      status: 200,
      body: {
        healthy: true,
        content: {
          healthy: true,
          publicUrl: defaultConfig.CONTENT_URL,
          commitHash: 'content_hash',
          version: 'content_1'
        },
        lambdas: {
          healthy: true,
          version: defaultConfig.CURRENT_VERSION,
          commitHash: defaultConfig.COMMIT_HASH,
          publicUrl: defaultConfig.LAMBDAS_URL
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        comms: {
          healthy: true,
          protocol: 'v3',
          commitHash: 'archipelago_hash',
          version: 'archipelago_1',
          usersCount: 1000
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 1000,
          publicUrl: '/bff'
        },
        acceptingUsers: false
      }
    })
  })
})
