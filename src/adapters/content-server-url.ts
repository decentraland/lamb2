import { AppComponents } from '../types'

export async function createContentServerUrl(
  components: Pick<AppComponents, 'config'>
): Promise<{ get: () => string }> {
  const contentServerURL = await getContentServerAddress(components)

  return {
    get: () => contentServerURL
  }
}

async function getContentServerAddress(components: Pick<AppComponents, 'config'>) {
  let configAddress: string =
    (await components.config.getString('CONTENT_SERVER_ADDRESS')) ?? 'http://content-server:6969'
  configAddress = configAddress.toLowerCase()
  if (!configAddress.startsWith('http')) {
    configAddress = 'http://' + configAddress
  }
  while (configAddress.endsWith('/')) {
    configAddress = configAddress.slice(0, -1)
  }
  return configAddress
}
