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
  context: Pick<
    HandlerContextWithPath<'status' | 'resourcesStatusCheck' | 'config' | 'realmName', '/about'>,
    'url' | 'components'
  >
): Promise<{ status: 200 | 503; body: About }> {
  const { config, status, resourcesStatusCheck, realmName } = context.components

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
    status.getServiceStatus<StatusContent>(contentUrl.statusUrl),
    status.getServiceStatus<DefaultStatus>(lambdasUrl.statusUrl),
    resourcesStatusCheck.areResourcesOverloaded(),
    realmName.getRealmName()
  ])

  const synchronizationStatus = contentStatus.data?.synchronizationStatus.synchronizationState
  contentStatus.healthy = contentStatus.healthy && synchronizationStatus === 'Syncing'

  const healthy = archipelagoStatus.healthy && contentStatus.healthy && lambdasStatus.healthy
  const userCount = archipelagoStatus.data?.userCount || 0
  const acceptingUsers = healthy && !resourcesOverload && (!maxUsers || userCount < maxUsers)

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
      protocolVersion: '1.0_0',
      publicUrl: '/bff'
    },
    acceptingUsers
  }

  return {
    status: result.healthy ? 200 : 503,
    body: result
  }
}
