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

// Legacy /profile/:id never 404'd — when no profile existed it returned a stub
// `{ avatars: [], timestamp: 0 }`. Callers (governance, decentraland-gatsby,
// top-scenes, dao-landing, public sdk docs) lean on `.avatars` always being
// an array. The alias preserves that contract; the canonical /profiles/:id
// keeps the stricter 404 behavior.
export async function profileAliasHandler(
  context: Pick<HandlerContextWithPath<'profiles', '/profile/:id'>, 'components' | 'params'>
): Promise<{ status: 200; body: Profile | { avatars: []; timestamp: 0 } }> {
  const profile = await context.components.profiles.getProfile(context.params.id)
  if (!profile) {
    return { status: 200, body: { avatars: [], timestamp: 0 } }
  }
  return { status: 200, body: profile }
}
