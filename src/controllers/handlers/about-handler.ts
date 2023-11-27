import { HandlerContextWithPath } from '../../types'
import { About, StatusContent } from '@dcl/catalyst-api-specs/lib/client'
import { l1Contracts, L1Network } from '@dcl/catalyst-contracts'

export type ArchipelagoStatus = {
  version: string
  commitHash: string
  userCount: number
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
  context: Pick<HandlerContextWithPath<'status' | 'resourcesStatusCheck' | 'config', '/about'>, 'url' | 'components'>
): Promise<{ status: 200 | 503; body: About }> {
  const { config, status, resourcesStatusCheck } = context.components
  const ethNetwork = (await config.getString('ETH_NETWORK')) ?? 'mainnet'

  const contracts = l1Contracts[ethNetwork as L1Network]
  if (!contracts) {
    throw new Error(`Invalid ETH_NETWORK: ${ethNetwork}`)
  }
  const maxUsers = await config.getNumber('MAX_USERS')

  const [
    lambdasPublicUrl,
    lambdasInternalUrl,
    contentPublicUrl,
    contentInternalUrl,
    archipelagoPublicUrl,
    archipelagoInternalUrl,
    commitHash,
    currentVersion,
    realmName
  ] = await Promise.all([
    config.requireString('LAMBDAS_URL'),
    config.getString('INTERNAL_LAMBDAS_URL'),
    config.requireString('CONTENT_URL'),
    config.getString('INTERNAL_CONTENT_URL'),
    config.getString('ARCHIPELAGO_URL'),
    config.getString('INTERNAL_ARCHIPELAGO_URL'),
    config.getString('COMMIT_HASH'),
    config.getString('CURRENT_VERSION'),
    config.getString('REALM_NAME')
  ])

  const lambdasUrl = getUrl(lambdasPublicUrl, lambdasInternalUrl)
  const contentUrl = getUrl(contentPublicUrl, contentInternalUrl)

  const [contentStatus, lambdasStatus, resourcesOverload] = await Promise.all([
    status.getServiceStatus<StatusContent>(contentUrl.statusUrl),
    status.getServiceStatus<DefaultStatus>(lambdasUrl.statusUrl),
    resourcesStatusCheck.areResourcesOverloaded()
  ])

  const synchronizationStatus = contentStatus.data?.synchronizationStatus.synchronizationState || 'Unknown'
  contentStatus.healthy = contentStatus.healthy && synchronizationStatus === 'Syncing'

  let healthy = contentStatus.healthy && lambdasStatus.healthy
  let acceptingUsers = healthy && !resourcesOverload
  let comms = undefined

  if (archipelagoPublicUrl) {
    const archipelagoUrl = getUrl(archipelagoPublicUrl, archipelagoInternalUrl)
    const archipelagoStatus = await status.getServiceStatus<ArchipelagoStatus>(archipelagoUrl.statusUrl)
    const userCount = archipelagoStatus.data?.userCount || 0
    healthy = healthy && archipelagoStatus.healthy
    acceptingUsers = acceptingUsers && (!maxUsers || userCount < maxUsers)
    const url = new URL('/archipelago/ws', archipelagoPublicUrl).toString()
    const archipelagoWSUrl = `archipelago:archipelago:${url.replace(/^http/, 'ws')}`
    comms = {
      healthy: archipelagoStatus.healthy,
      protocol: 'v3',
      version: archipelagoStatus.data?.version,
      commitHash: archipelagoStatus.data?.commitHash,
      usersCount: userCount,
      adapter: archipelagoWSUrl
    }
  }

  const result = {
    healthy: healthy,
    content: {
      healthy: contentStatus.healthy,
      version: contentStatus.data?.version,
      synchronizationStatus,
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
      networkId: contracts.chainId,
      globalScenesUrn: [],
      scenesUrn: [],
      realmName
    },
    comms,
    bff: {
      healthy: true,
      protocolVersion: '1.0_0',
      userCount: 0,
      publicUrl: '/bff'
    },
    acceptingUsers
  }

  return {
    status: result.healthy ? 200 : 503,
    body: result
  }
}
