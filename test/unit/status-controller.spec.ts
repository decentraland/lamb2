import { createConfigComponent } from '@well-known-components/env-config-provider'
import { statusHandler } from '../../src/controllers/handlers/status-handler'

describe('status-controller-unit', () => {
  it('must return commit hash', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent({ COMMIT_HASH: 'commit_hash' })
    expect(await statusHandler({ url, components: { config } })).toMatchObject({
      body: { commitHash: 'commit_hash' }
    })
  })

  it('must return current version', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent({ CURRENT_VERSION: 'current_version' })
    expect(await statusHandler({ url, components: { config } })).toMatchObject({
      body: { version: 'current_version' }
    })
  })

  it('must return currentTime', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent({})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({
      body: { currentTime: expect.any(Number) }
    })
  })

  it('must return empty for values that does not have default value', async () => {
    const url = new URL('https://github.com/well-known-components')
    const config = createConfigComponent({})
    expect(await statusHandler({ url, components: { config } })).toMatchObject({
      body: { commitHash: '', version: '' }
    })
  })
})
