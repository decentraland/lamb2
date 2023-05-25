import { HandlerContextWithPath } from '../../types'
import { GetAboutCatalystInfo200 } from '@dcl/catalyst-api-specs/lib/client'

const networkIds: Record<string, number> = {
  goerli: 5,
  mainnet: 1
}

export type ArchipelagoStatus = {
  version: string
  commitHash: string
  usersCount: number
}

export type DefaultStatus = Omit<ArchipelagoStatus, 'userCount'>

function getUrl(publicURL: string, healthCheckURL?: string) {
  let url = healthCheckURL ? healthCheckURL : publicURL
  if (!url.endsWith('/')) {
    url += '/'
  }
  url += 'status'

  return {
    publicUrl: publicURL,
    statusUrl: url
  }
}

// handlers arguments only type what they need, to make unit testing easier
export async function aboutHandler(
  context: Pick<
    HandlerContextWithPath<'status' | 'resourcesStatusCheck' | 'config' | 'realmName', '/about'>,
    'url' | 'components'
  >
): Promise<{ status: 200 | 503; body: GetAboutCatalystInfo200 }> {
  const { config, status, resourcesStatusCheck, realmName } = context.components

  const ethNetwork = (await config.getString('ETH_NETWORK')) ?? 'mainnet'
  const maxUsers = await config.getNumber('MAX_USERS')
  const networkId = networkIds[ethNetwork]

  const [
    lambdasPublicUrl,
    lambdasInternalUrl,
    contentPublicUrl,
    contentInternalUrl,
    archipelagoPublicUrl,
    archipelagoInternalUrl,
    commitHash,
    currentVersion
  ] = await Promise.all([
    config.requireString('LAMBDAS_URL'),
    config.getString('INTERNAL_LAMBDAS_URL'),
    config.requireString('CONTENT_URL'),
    config.getString('INTERNAL_CONTENT_URL'),
    config.requireString('ARCHIPELAGO_URL'),
    config.getString('INTERNAL_ARCHIPELAGO_URL'),
    config.getString('COMMIT_HASH'),
    config.getString('CURRENT_VERSION')
  ])

  const lambdasUrl = getUrl(lambdasPublicUrl, lambdasInternalUrl)
  const contentUrl = getUrl(contentPublicUrl, contentInternalUrl)
  const archipelagoUrl = getUrl(archipelagoPublicUrl, archipelagoInternalUrl)

  const [archipelagoStatus, contentStatus, lambdasStatus, resourcesOverload, name] = await Promise.all([
    status.getServiceStatus<ArchipelagoStatus>(archipelagoUrl.statusUrl),
    status.getServiceStatus<DefaultStatus>(contentUrl.statusUrl),
    status.getServiceStatus<DefaultStatus>(lambdasUrl.statusUrl),
    resourcesStatusCheck.areResourcesOverloaded(),
    realmName.getValidatedRealmName()
  ])

  const healthy = archipelagoStatus.healthy && contentStatus.healthy && lambdasStatus.healthy
  const userCount = archipelagoStatus.data?.usersCount || 0
  const acceptingUsers = healthy && !resourcesOverload && (!maxUsers || userCount < maxUsers)

  const result = {
    healthy: healthy,
    content: {
      healthy: contentStatus.healthy,
      version: contentStatus.data?.version,
      commitHash: contentStatus?.data?.commitHash,
      publicUrl: contentUrl.publicUrl
    },
    lambdas: {
      healthy: true,
      version: currentVersion,
      commitHash: commitHash,
      publicUrl: lambdasUrl.publicUrl
    },
    configurations: {
      networkId,
      globalScenesUrn: [],
      scenesUrn: [],
      realmName: name
    },
    comms: {
      healthy: archipelagoStatus.healthy,
      protocol: 'v3',
      version: archipelagoStatus.data?.version,
      commitHash: archipelagoStatus.data?.commitHash,
      usersCount: userCount
    },
    bff: {
      healthy: true,
      userCount,
      protocolVersion: '1.0_0'
    },
    acceptingUsers
  }

  return {
    status: result.healthy ? 200 : 503,
    body: result
  }
}
