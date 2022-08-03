import { EthAddress } from '@dcl/crypto'
import { IBaseComponent, IConfigComponent } from '@well-known-components/interfaces'
import { ContentAPI, ContentClient } from 'dcl-catalyst-client'
import { EntityType } from '@dcl/schemas'

// TODO: use a common schema instead of this type
export type ProfileMetadata = {

}

export type ContentComponent = IBaseComponent & {
  getProfiles: (ethAddresses: EthAddress[]) => ProfileMetadata[]
  client: ContentAPI | undefined
}

export async function createContentComponent(config: IConfigComponent): Promise<ContentComponent> {

  let client: ContentAPI | undefined

  async function start() {
    const contentServerAddress = (await config.getString('CONTENT_SERVER_ADDRESS')) ?? 'http://content-server:6969'
    client = new ContentClient({ contentUrl: contentServerAddress })
  }
      
  async function stop() {}

  function getProfiles(ethAddresses: EthAddress[]): ProfileMetadata[] {
    
    return []
}
    
  return {
    start,
    stop,
    getProfiles,
    client
  }
}
