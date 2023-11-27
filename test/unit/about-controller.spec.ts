import { createConfigComponent } from '@well-known-components/env-config-provider'
import { ServiceStatus } from '../../src/adapters/status'
import { aboutHandler } from '../../src/controllers/handlers/about-handler'

describe('about-controller-unit', () => {
  const defaultConfigWithoutComms = {
    LAMBDAS_URL: 'https://peer.decentraland.org/lambdas',
    INTERNAL_LAMBDAS_URL: 'http://lambdas',
    CONTENT_URL: 'https://peer.decentraland.org/content',
    INTERNAL_CONTENT_URL: 'http://content',
    INTERNAL_ARCHIPELAGO_URL: 'http://archipelgo',
    COMMIT_HASH: 'commit_hash',
    CURRENT_VERSION: '1.0.0',
    MAX_USERS: '400',
    REALM_NAME: 'testName'
  }

  const config = createConfigComponent(defaultConfigWithoutComms)
  const url = new URL('https://github.com/well-known-components')

  it('content is bootstrapping', async () => {
    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfigWithoutComms.INTERNAL_CONTENT_URL}/status`:
          return {
            healthy: true,
            data: {
              version: 'content_1',
              commitHash: 'content_hash',
              synchronizationStatus: { synchronizationState: 'Bootstrapping' }
            }
          }
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
      resourcesStatusCheck: { areResourcesOverloaded }
    }

    const response = await aboutHandler({ url, components })

    expect(response).toMatchObject({
      status: 503,
      body: {
        healthy: false,
        content: {
          healthy: false,
          publicUrl: defaultConfigWithoutComms.CONTENT_URL,
          version: 'content_1',
          commitHash: 'content_hash',
          synchronizationStatus: 'Bootstrapping'
        },
        lambdas: {
          healthy: true,
          version: defaultConfigWithoutComms.CURRENT_VERSION,
          commitHash: defaultConfigWithoutComms.COMMIT_HASH,
          publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 0,
          publicUrl: '/bff'
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        acceptingUsers: false
      }
    })
  })

  it('services are unhealthy', async () => {
    async function getServiceStatus<T>(_statusUrl: string): Promise<ServiceStatus<T>> {
      return { healthy: false }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return false
    }

    const components = {
      config,
      status: { getServiceStatus },
      resourcesStatusCheck: { areResourcesOverloaded }
    }

    const response = await aboutHandler({ url, components })

    expect(response).toMatchObject({
      status: 503,
      body: {
        healthy: false,
        content: {
          healthy: false,
          publicUrl: defaultConfigWithoutComms.CONTENT_URL,
          commitHash: undefined,
          version: undefined,
          synchronizationStatus: 'Unknown'
        },
        lambdas: {
          healthy: true,
          version: defaultConfigWithoutComms.CURRENT_VERSION,
          commitHash: defaultConfigWithoutComms.COMMIT_HASH,
          publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 0,
          publicUrl: '/bff'
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        acceptingUsers: false
      }
    })
  })

  it('services are healthy', async () => {
    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfigWithoutComms.INTERNAL_LAMBDAS_URL}/status`:
          return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
        case `${defaultConfigWithoutComms.INTERNAL_ARCHIPELAGO_URL}/status`:
          return { healthy: true, data: { version: 'archipelago_1', commitHash: 'archipelago_hash', userCount: 10 } }
        case `${defaultConfigWithoutComms.INTERNAL_CONTENT_URL}/status`:
          return {
            healthy: true,
            data: {
              version: 'content_1',
              commitHash: 'content_hash',
              synchronizationStatus: { synchronizationState: 'Syncing' }
            }
          }
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
      resourcesStatusCheck: { areResourcesOverloaded }
    }

    const response = await aboutHandler({ url, components })

    expect(response).toMatchObject({
      status: 200,
      body: {
        healthy: true,
        content: {
          healthy: true,
          publicUrl: defaultConfigWithoutComms.CONTENT_URL,
          commitHash: 'content_hash',
          version: 'content_1',
          synchronizationStatus: 'Syncing'
        },
        lambdas: {
          healthy: true,
          version: defaultConfigWithoutComms.CURRENT_VERSION,
          commitHash: defaultConfigWithoutComms.COMMIT_HASH,
          publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 0,
          publicUrl: '/bff'
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        acceptingUsers: true
      }
    })
  })

  it('services are healthy, but resources are overloaded', async () => {
    async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
      switch (statusUrl) {
        case `${defaultConfigWithoutComms.INTERNAL_LAMBDAS_URL}/status`:
          return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
        case `${defaultConfigWithoutComms.INTERNAL_CONTENT_URL}/status`:
          return {
            healthy: true,
            data: {
              version: 'content_1',
              commitHash: 'content_hash',
              synchronizationStatus: { synchronizationState: 'Syncing' }
            }
          }
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
      resourcesStatusCheck: { areResourcesOverloaded }
    }

    const response = await aboutHandler({ url, components })

    expect(response).toMatchObject({
      status: 200,
      body: {
        healthy: true,
        content: {
          healthy: true,
          publicUrl: defaultConfigWithoutComms.CONTENT_URL,
          commitHash: 'content_hash',
          version: 'content_1',
          synchronizationStatus: 'Syncing'
        },
        lambdas: {
          healthy: true,
          version: defaultConfigWithoutComms.CURRENT_VERSION,
          commitHash: defaultConfigWithoutComms.COMMIT_HASH,
          publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
        },
        bff: {
          healthy: true,
          protocolVersion: '1.0_0',
          userCount: 0,
          publicUrl: '/bff'
        },
        configurations: {
          networkId: 1,
          globalScenesUrn: [],
          scenesUrn: [],
          realmName: 'testName'
        },
        acceptingUsers: false
      }
    })
  })

  describe('when comms is enabled', () => {
    const configWithComms = {
      ...defaultConfigWithoutComms,
      ARCHIPELAGO_URL: 'https://peer.decentraland.org/archipelago'
    }

    const config = createConfigComponent(configWithComms)

    it('services are healthy', async () => {
      async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
        switch (statusUrl) {
          case `${defaultConfigWithoutComms.INTERNAL_LAMBDAS_URL}/status`:
            return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
          case `${defaultConfigWithoutComms.INTERNAL_ARCHIPELAGO_URL}/status`:
            return { healthy: true, data: { version: 'archipelago_1', commitHash: 'archipelago_hash', userCount: 10 } }
          case `${defaultConfigWithoutComms.INTERNAL_CONTENT_URL}/status`:
            return {
              healthy: true,
              data: {
                version: 'content_1',
                commitHash: 'content_hash',
                synchronizationStatus: { synchronizationState: 'Syncing' }
              }
            }
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
        resourcesStatusCheck: { areResourcesOverloaded }
      }

      const response = await aboutHandler({ url, components })

      expect(response).toEqual({
        status: 200,
        body: {
          healthy: true,
          content: {
            healthy: true,
            publicUrl: defaultConfigWithoutComms.CONTENT_URL,
            commitHash: 'content_hash',
            version: 'content_1',
            synchronizationStatus: 'Syncing'
          },
          lambdas: {
            healthy: true,
            version: defaultConfigWithoutComms.CURRENT_VERSION,
            commitHash: defaultConfigWithoutComms.COMMIT_HASH,
            publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
          },
          bff: {
            healthy: true,
            protocolVersion: '1.0_0',
            userCount: 0,
            publicUrl: '/bff'
          },
          configurations: {
            networkId: 1,
            globalScenesUrn: [],
            scenesUrn: [],
            realmName: 'testName'
          },
          comms: {
            commitHash: 'archipelago_hash',
            healthy: true,
            protocol: 'v3',
            usersCount: 10,
            version: 'archipelago_1',
            adapter: 'archipelago:archipelago:wss://peer.decentraland.org/archipelago/ws'
          },
          acceptingUsers: true
        }
      })
    })
    it('services are healthy, but there are too many users', async () => {
      async function getServiceStatus(statusUrl: string): Promise<ServiceStatus<any>> {
        switch (statusUrl) {
          case `${defaultConfigWithoutComms.INTERNAL_LAMBDAS_URL}/status`:
            return { healthy: true, data: { version: 'lambdas_1', commitHash: 'lambdas_hash' } }
          case `${defaultConfigWithoutComms.INTERNAL_ARCHIPELAGO_URL}/status`:
            return {
              healthy: true,
              data: { version: 'archipelago_1', commitHash: 'archipelago_hash', userCount: 1000 }
            }
          case `${defaultConfigWithoutComms.INTERNAL_CONTENT_URL}/status`:
            return {
              healthy: true,
              data: {
                version: 'content_1',
                commitHash: 'content_hash',
                synchronizationStatus: { synchronizationState: 'Syncing' }
              }
            }
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
        resourcesStatusCheck: { areResourcesOverloaded }
      }

      const response = await aboutHandler({ url, components })

      expect(response).toEqual({
        status: 200,
        body: {
          healthy: true,
          content: {
            healthy: true,
            publicUrl: defaultConfigWithoutComms.CONTENT_URL,
            commitHash: 'content_hash',
            version: 'content_1',
            synchronizationStatus: 'Syncing'
          },
          lambdas: {
            healthy: true,
            version: defaultConfigWithoutComms.CURRENT_VERSION,
            commitHash: defaultConfigWithoutComms.COMMIT_HASH,
            publicUrl: defaultConfigWithoutComms.LAMBDAS_URL
          },
          bff: {
            healthy: true,
            protocolVersion: '1.0_0',
            userCount: 0,
            publicUrl: '/bff'
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
            usersCount: 1000,
            adapter: 'archipelago:archipelago:wss://peer.decentraland.org/archipelago/ws'
          },
          acceptingUsers: false
        }
      })
    })
  })
})
