import { HandlerContextWithPath, InvalidRequestError, NotFoundError } from '../../types'
import { Profile } from '@dcl/catalyst-api-specs/lib/client'

export async function profilesHandler(
  context: Pick<HandlerContextWithPath<'profiles', '/profiles'>, 'components' | 'request'>
): Promise<{ status: 200; body: Profile[] } | { status: 304 }> {
  const { components, request } = context

  const body = await request.json()

  if (!body.ids) {
    throw new InvalidRequestError('No profile ids were specified. Expected ids:string[] in body')
  }

  let modifiedSince: number | undefined = undefined
  {
    // This is a standard HTTP header. See the link below for more information
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
    const value = request.headers.get('if-modified-since')
    if (value) {
      try {
        const timestamp = Date.parse(value)
        modifiedSince = isNaN(timestamp) ? undefined : timestamp
      } catch (e) {}
    }
  }

  const profiles = await components.profiles.getProfiles(body.ids, modifiedSince)

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
  context: Pick<HandlerContextWithPath<'profiles', '/profiles/:id'>, 'components' | 'params'>
): Promise<{ status: 200; body: Profile }> {
  const profile = await context.components.profiles.getProfile(context.params.id)
  if (!profile) {
    throw new NotFoundError('Profile not found')
  }

  return {
    status: 200,
    body: profile
  }
}

export async function explorerProfileHandler(
  context: Pick<HandlerContextWithPath<'profiles' | 'identity' | 'hasher', '/profiles/:id'>, 'components' | 'params'>
): Promise<{ status: 200; body: any }> {
  const { components, params } = context
  const profile = await components.profiles.getProfile(params.id)
  if (!profile) {
    throw new NotFoundError('Profile not found')
  }

  const avatar = profile.avatars[0]

  const payload = JSON.stringify([avatar.name, avatar.hasClaimedName, ...avatar.avatar.wearables])
  const hash = await components.hasher.hash(payload)
  const signedHash = components.identity.sign(hash)

  return {
    status: 200,
    body: { profile, hash, signedHash }
  }
}
