import { AppComponents } from '../types'

export type ContentServerUrls = {
  publicUrl: string
  internalUrl: string
}

function normalizeContentServerUrl(configAddress: string): string {
  configAddress = configAddress.toLowerCase()
  if (!configAddress.startsWith('http')) {
    configAddress = 'http://' + configAddress
  }
  while (configAddress.endsWith('/')) {
    configAddress = configAddress.slice(0, -1)
  }
  return configAddress
}

/**
 * Creates the public and internal content server URLs.
 *
 * Public URLs are used for response payloads and asset links clients must access.
 * Internal URLs are used for server-side fetches to avoid routing through the public internet.
 */
export async function createContentServerUrls(components: Pick<AppComponents, 'config'>): Promise<ContentServerUrls> {
  const publicUrl = normalizeContentServerUrl(
    (await components.config.getString('CONTENT_URL')) ?? 'http://content-server:6969'
  )
  const internalUrl = normalizeContentServerUrl(
    (await components.config.getString('INTERNAL_CONTENT_URL')) ?? publicUrl
  )

  return {
    publicUrl,
    internalUrl
  }
}

/**
 * Creates the public content server URL.
 */
export async function createContentServerUrl(components: Pick<AppComponents, 'config'>): Promise<string> {
  return (await createContentServerUrls(components)).publicUrl
}
