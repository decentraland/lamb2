import { HandlerContextWithPath } from '../../types'

export async function statusHandler(context: Pick<HandlerContextWithPath<'config', '/status'>, 'url' | 'components'>) {
  const {
    components: { config }
  } = context

  const [commitHash, contentServerUrl, version] = await Promise.all([
    config.getString('COMMIT_HASH'),
    config.getString('CONTENT_SERVER_ADDRESS'),
    config.getString('CURRENT_VERSION')
  ])

  return {
    body: {
      version: version ?? '',
      currentTime: Date.now(),
      contentServerUrl: contentServerUrl ?? '',
      commitHash: commitHash ?? ''
    }
  }
}
