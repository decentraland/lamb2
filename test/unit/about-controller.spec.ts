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
    CURRENT_VERSION: '1.0.0'
  }
  it('ok', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent(defaultConfig)

    async function getServiceStatus<T>(_statusUrl: string): Promise<ServiceStatus<T>> {
      return { healthy: false }
    }

    async function areResourcesOverloaded(): Promise<boolean> {
      return false
    }

    async function getValidatedRealmName(): Promise<string | undefined> {
      return 'testName'
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
          userCount: 0
        },
        acceptingUsers: false
      }
    })
  })
})
