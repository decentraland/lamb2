import { AppComponents } from '../types'

export async function createContentServerUrl(components: Pick<AppComponents, 'config'>): Promise<string> {
  let configAddress: string = (await components.config.getString('CONTENT_URL')) ?? 'http://content-server:6969'
  configAddress = configAddress.toLowerCase()
  if (!configAddress.startsWith('http')) {
    configAddress = 'http://' + configAddress
  }
  while (configAddress.endsWith('/')) {
    configAddress = configAddress.slice(0, -1)
  }
  return configAddress
}
