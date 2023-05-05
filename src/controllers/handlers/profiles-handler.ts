import { Request } from 'node-fetch'
import { getProfiles } from '../../logic/profiles'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

export async function profilesHandler(
  context: HandlerContextWithPath<
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches',
    '/profiles'
  >
) {
  // Get the profile ids
  const body = await context.request.json()
  const ids = body.ids

  // Return 400 if there are no ids in the payload
  if (!ids) {
    throw new InvalidRequestError('No profile ids were specified. Expected ids:string[] in body')
  }

  // Get profiles depending on their addresses
  const profiles = await getProfiles(context.components, ids, getIfModifiedSinceTimestamp(context.request))

  // The only case in which we receive undefined profiles is when no profile was updated after de If-Modified-Since specified moment.
  // In this case, as per spec, we return 304 (not modified) and empty body
  // See here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
  if (!profiles)
    return {
      status: 304
    }

  return {
    status: 200,
    body: profiles
  }
}

export async function profileHandler(
  context: HandlerContextWithPath<
    'metrics' | 'content' | 'theGraph' | 'config' | 'fetch' | 'ownershipCaches',
    '/profile/:id'
  >
) {
  const profiles = await getProfiles(context.components, [context.params.id])
  if (!profiles || profiles.length === 0) {
    return {
      status: 404,
      body: {}
    }
  }

  return {
    status: 200,
    body: profiles[0]
  }
}

function getIfModifiedSinceTimestamp(req: Request): number | undefined {
  // This is a standard HTTP header. See the link below for more information
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
  const headerValue = req.headers.get('if-modified-since')
  if (!headerValue) return
  try {
    const timestamp = Date.parse(headerValue)
    return isNaN(timestamp) ? undefined : timestamp
  } catch (e) {
    // LOGGER.warn('Received an invalid header for If-Modified-Since ', headerValue)
    return
  }
}
