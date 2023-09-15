import { test } from '../components'

test('integration sanity tests using a real server backend', function ({ components, stubComponents }) {
  it('responds with all default properties', async () => {
    const { localFetch } = components
    const r = await localFetch.fetch('/status')

    expect(r.status).toEqual(200)
    expect(await r.json()).toMatchObject({
      commitHash: 'commit_hash',
      currentTime: expect.any(Number),
      version: 'version'
    })
  })

  it('random url responds 404', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch('/status' + Math.random())

    expect(r.status).toEqual(404)
  })
})
