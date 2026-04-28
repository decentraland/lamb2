import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createContentServerUrls } from '../../../src/adapters/content-server-url'

describe('when creating content server urls', () => {
  describe('and an internal content url is configured', () => {
    let urls: Awaited<ReturnType<typeof createContentServerUrls>>

    beforeEach(async () => {
      const config = createConfigComponent({
        CONTENT_URL: 'https://peer.decentraland.org/content/',
        INTERNAL_CONTENT_URL: 'content-server:6969/'
      })

      urls = await createContentServerUrls({ config })
    })

    it('should use the public content url for returned urls', () => {
      expect(urls.publicUrl).toBe('https://peer.decentraland.org/content')
    })

    it('should use the internal content url for fetch urls', () => {
      expect(urls.internalUrl).toBe('http://content-server:6969')
    })
  })

  describe('and an internal content url is not configured', () => {
    let urls: Awaited<ReturnType<typeof createContentServerUrls>>

    beforeEach(async () => {
      const config = createConfigComponent({
        CONTENT_URL: 'https://peer.decentraland.org/content/'
      })

      urls = await createContentServerUrls({ config })
    })

    it('should fall back to the public content url for fetch urls', () => {
      expect(urls.internalUrl).toBe('https://peer.decentraland.org/content')
    })
  })
})
