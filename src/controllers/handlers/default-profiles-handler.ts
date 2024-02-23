import { HandlerContextWithPath, NotFoundError } from '../../types'
import { Profile } from '@dcl/catalyst-api-specs/lib/client'

export async function defaultProfileHandler(
  context: Pick<HandlerContextWithPath<'defaultProfiles', '/default-profiles/:id'>, 'components' | 'params'>
): Promise<{ status: 200; body: Profile }> {
  const profile = context.components.defaultProfiles.getProfile(context.params.id)
  if (!profile) {
    throw new NotFoundError('Profile not found')
  }

  return {
    status: 200,
    body: profile
  }
}
