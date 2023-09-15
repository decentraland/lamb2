import { getProfiles } from '../../logic/profiles'
import { HandlerContextWithPath, InvalidRequestError, NotFoundError } from '../../types'
import { Profile } from '@dcl/catalyst-api-specs/lib/client'
import { hashV1 } from '@dcl/hashing'

type ProfilesComponents =
  | 'metrics'
  | 'content'
  | 'theGraph'
  | 'config'
  | 'fetch'
  | 'ownershipCaches'
  | 'thirdPartyProvidersStorage'
  | 'logs'
  | 'metrics'
  | 'emotesFetcher'
  | 'wearablesFetcher'

const encoder = new TextEncoder()

export async function profilesHandler(
  context: HandlerContextWithPath<ProfilesComponents, '/profiles'>
): Promise<{ status: 200; body: Profile[] } | { status: 304 }> {
  // Get the profile ids
  const body = await context.request.json()
  const ids = body.ids

  // Return 400 if there are no ids in the payload
  if (!ids) {
    throw new InvalidRequestError('No profile ids were specified. Expected ids:string[] in body')
  }

  let modifiedSince: number | undefined = undefined
  {
    // This is a standard HTTP header. See the link below for more information
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
    const value = context.request.headers.get('if-modified-since')
    if (value) {
      try {
        const timestamp = Date.parse(value)
        modifiedSince = isNaN(timestamp) ? undefined : timestamp
      } catch (e) {
        // LOGGER.warn('Received an invalid header for If-Modified-Since ', headerValue)
      }
    }
  }

  // Get profiles depending on their addresses
  const profiles = await getProfiles(context.components, ids, modifiedSince)

  // The only case in which we receive undefined profiles is when no profile was updated after de If-Modified-Since specified moment.
  // In this case, as per spec, we return 304 (not modified) and empty body
  // See here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
  if (!profiles) {
    return {
      status: 304
    }
  }

  return {
    status: 200,
    body: profiles
  }
}

export async function profileHandler(
  context: HandlerContextWithPath<ProfilesComponents, '/profile/:id'>
): Promise<{ status: 200; body: Profile }> {
  const profiles = await getProfiles(context.components, [context.params.id])
  if (!profiles || profiles.length === 0) {
    throw new NotFoundError('Profile not found')
  }

  return {
    status: 200,
    body: profiles[0]
  }
}

export async function explorerProfileHandler(
  context: HandlerContextWithPath<ProfilesComponents | 'identity', '/profile/:id'>
): Promise<{ status: 200; body: any }> {
  const profiles = await getProfiles(context.components, [context.params.id])
  if (!profiles || profiles.length === 0) {
    throw new NotFoundError('Profile not found')
  }

  const profile = profiles[0]
  const avatar = profile.avatars[0]

  const payload = JSON.stringify([avatar.name, avatar.hasClaimedName, ...avatar.avatar.wearables])
  const hash = await hashV1(encoder.encode(payload))
  const signedHash = context.components.identity.sign(hash)

  const body = { profile, hash, signedHash }

  return {
    status: 200,
    body
  }
}
