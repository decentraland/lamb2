import { ProfileMetadata } from '../../types'

export interface IProfilesComponent {
  getProfiles(
    ethAddresses: string[],
    ifModifiedSinceTimestamp?: number | undefined
  ): Promise<ProfileMetadata[] | undefined>

  getProfile(ethAddress: string): Promise<ProfileMetadata | undefined>
}
